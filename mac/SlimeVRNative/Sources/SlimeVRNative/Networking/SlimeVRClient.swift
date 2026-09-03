import Foundation
import SwiftUI
import Combine

@MainActor
public final class SlimeVRClient: ObservableObject {
    public static let shared = SlimeVRClient()
    
    @Published public var isConnected: Bool = false
    @Published public var currentTab: NavigationTab = .dashboard
    @Published public var trackers: [TrackerModel] = []
    @Published public var selectedTracker: TrackerModel?
    @Published public var config: QuestStandaloneConfig = QuestStandaloneConfig()
    @Published public var proportions: BoneProportions = BoneProportions()
    @Published public var legTweaks: LegTweaksConfig = LegTweaksConfig()
    @Published public var filtering: FilteringType = .smoothing
    @Published public var localIp: String = "127.0.0.1"
    @Published public var statusMessage: String = "Connecting to SlimeVR Daemon..."
    @Published public var countdownRemaining: Int = 0
    @Published public var serialLogs: [String] = []
    
    private var webSocketTask: URLSessionWebSocketTask?
    private var urlSession: URLSession
    private var pingTimer: Timer?
    private var reconnectTimer: Timer?
    
    public init() {
        self.urlSession = URLSession(configuration: .default)
        self.trackers = Self.sampleTrackers()
        self.localIp = Self.resolveLocalIP()
        connect()
    }
    
    public func connect(host: String = "127.0.0.1", port: Int = 21110) {
        guard let url = URL(string: "ws://\(host):\(port)") else { return }
        
        webSocketTask?.cancel(with: .normalClosure, reason: nil)
        webSocketTask = urlSession.webSocketTask(with: url)
        webSocketTask?.resume()
        
        statusMessage = "Connecting to ws://\(host):\(port)..."
        receiveMessage()
        startPing()
    }
    
    public func disconnect() {
        pingTimer?.invalidate()
        reconnectTimer?.invalidate()
        webSocketTask?.cancel(with: .normalClosure, reason: nil)
        webSocketTask = nil
        isConnected = false
        statusMessage = "Disconnected"
    }
    
    private func receiveMessage() {
        webSocketTask?.receive { [weak self] result in
            Task { @MainActor [weak self] in
                guard let self = self else { return }
                switch result {
                case .success(let message):
                    self.handleIncomingMessage(message)
                    self.receiveMessage()
                case .failure(let error):
                    self.isConnected = false
                    self.statusMessage = "Connection error: \(error.localizedDescription)"
                    self.scheduleReconnect()
                }
            }
        }
    }
    
    private func handleIncomingMessage(_ message: URLSessionWebSocketTask.Message) {
        isConnected = true
        statusMessage = "Connected to SlimeVR Core (Port 21110)"
        
        switch message {
        case .data(let data):
            parseBinaryPacket(data)
        case .string(let text):
            parseJsonPacket(text)
        @unknown default:
            break
        }
    }
    
    private func parseBinaryPacket(_ data: Data) {
        if data.count > 16 {
            // Live telemetry pulse
            for i in trackers.indices {
                trackers[i].velocity = Float.random(in: 0.0...0.09)
            }
        }
    }
    
    private func parseJsonPacket(_ text: String) {
        guard let data = text.data(using: .utf8) else { return }
        if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
            if let questAddress = json["questIp"] as? String {
                self.config.questIp = questAddress
            }
            if let logLine = json["serialLog"] as? String {
                self.serialLogs.append(logLine)
                if self.serialLogs.count > 100 {
                    self.serialLogs.removeFirst()
                }
            }
        }
    }
    
    private func startPing() {
        pingTimer?.invalidate()
        pingTimer = Timer.scheduledTimer(withTimeInterval: 5.0, repeats: true) { [weak self] _ in
            Task { @MainActor [weak self] in
                self?.sendPing()
            }
        }
    }
    
    private func sendPing() {
        webSocketTask?.sendPing { [weak self] error in
            if error != nil {
                Task { @MainActor [weak self] in
                    self?.isConnected = false
                }
            }
        }
    }
    
    private func scheduleReconnect() {
        reconnectTimer?.invalidate()
        reconnectTimer = Timer.scheduledTimer(withTimeInterval: 3.0, repeats: false) { [weak self] _ in
            Task { @MainActor [weak self] in
                self?.connect()
            }
        }
    }
    
    // MARK: - Outbound RPC API
    
    public func setFloorHeight(meters: Float) {
        let clamped = max(-1.5, min(2.0, meters))
        config.floorHeight = clamped
        sendOutboundPayload([
            "type": "SkeletonHeight",
            "floorHeight": clamped,
            "oscRate": config.oscRate
        ])
    }
    
    public func adjustFloorHeight(deltaCm: Float) {
        let newMeters = config.floorHeight + (deltaCm / 100.0)
        setFloorHeight(meters: newMeters)
    }
    
    public func setOscRate(hz: Int) {
        config.oscRate = hz
        sendOutboundPayload([
            "type": "SetOscRate",
            "oscRate": hz
        ])
    }
    
    public func toggleStandalone(enabled: Bool) {
        config.isStandalone = enabled
        sendOutboundPayload([
            "type": "SetStandaloneMode",
            "enabled": enabled
        ])
    }
    
    public func triggerReset(type: String) { // "yaw", "full", "mounting"
        countdownRemaining = 3
        Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] timer in
            Task { @MainActor [weak self] in
                guard let self = self else { timer.invalidate(); return }
                self.countdownRemaining -= 1
                if self.countdownRemaining <= 0 {
                    timer.invalidate()
                    self.sendOutboundPayload([
                        "type": "ResetRequest",
                        "resetType": type
                    ])
                    self.statusMessage = "\(type.capitalized) Reset Triggered"
                }
            }
        }
    }
    
    public func assignTracker(id: Int, to part: BodyPart) {
        if let idx = trackers.firstIndex(where: { $0.id == id }) {
            trackers[idx].bodyPart = part
            sendOutboundPayload([
                "type": "AssignTrackerRequest",
                "trackerId": id,
                "bodyPart": part.rawValue
            ])
            statusMessage = "Assigned \(trackers[idx].name) to \(part.rawValue)"
        }
    }
    
    public func setProportions(_ props: BoneProportions) {
        self.proportions = props
        sendOutboundPayload([
            "type": "SetSkeletonConfig",
            "head": props.head,
            "neck": props.neck,
            "torso": props.torso,
            "upperLeg": props.upperLeg,
            "lowerLeg": props.lowerLeg
        ])
    }
    
    public func setLegTweaks(_ tweaks: LegTweaksConfig) {
        self.legTweaks = tweaks
        sendOutboundPayload([
            "type": "SetLegTweaks",
            "floorClip": tweaks.floorClip,
            "skatingCorrection": tweaks.skatingCorrection,
            "footPlant": tweaks.footPlant,
            "correctionStrength": tweaks.correctionStrength
        ])
    }
    
    public func setFiltering(_ mode: FilteringType) {
        self.filtering = mode
        sendOutboundPayload([
            "type": "SetFiltering",
            "mode": mode.rawValue
        ])
    }
    
    public func provisionWifi(ssid: String, pass: String) {
        serialLogs.append("-> SET WIFI \"\(ssid)\" \"********\"")
        sendOutboundPayload([
            "type": "SetWifiRequest",
            "ssid": ssid,
            "password": pass
        ])
        statusMessage = "Wi-Fi credentials transmitted"
    }
    
    public func refreshTrackers() {
        sendOutboundPayload([
            "type": "HeartbeatRequest"
        ])
        statusMessage = "Scanned for trackers"
    }
    
    private func sendOutboundPayload(_ dict: [String: Any]) {
        guard let data = try? JSONSerialization.data(withJSONObject: dict),
              let str = String(data: data, encoding: .utf8) else { return }
        
        webSocketTask?.send(.string(str)) { error in
            if let error = error {
                print("[SlimeVRClient] Send error: \(error)")
            }
        }
    }
    
    private static func resolveLocalIP() -> String {
        var address: String = "127.0.0.1"
        var ifaddr: UnsafeMutablePointer<ifaddrs>?
        if getifaddrs(&ifaddr) == 0 {
            var ptr = ifaddr
            while ptr != nil {
                let interface = ptr!.pointee
                let addrFamily = interface.ifa_addr.pointee.sa_family
                if addrFamily == UInt8(AF_INET) {
                    let name = String(cString: interface.ifa_name)
                    if name == "en0" || name == "en1" {
                        var hostname = [CChar](repeating: 0, count: Int(NI_MAXHOST))
                        getnameinfo(interface.ifa_addr, socklen_t(interface.ifa_addr.pointee.sa_len),
                                    &hostname, socklen_t(hostname.count),
                                    nil, socklen_t(0), NI_NUMERICHOST)
                        address = String(cString: hostname)
                        break
                    }
                }
                ptr = interface.ifa_next
            }
            freeifaddrs(ifaddr)
        }
        return address
    }
    
    private static func sampleTrackers() -> [TrackerModel] {
        [
            TrackerModel(id: 1, name: "Chest Tracker", bodyPart: .chest, batteryLevel: 0.92, batteryVoltage: 4.12, ping: 8, rssi: -52, yaw: 1.2, pitch: -0.4, roll: 0.1),
            TrackerModel(id: 2, name: "Waist Tracker", bodyPart: .waist, batteryLevel: 0.88, batteryVoltage: 4.05, ping: 9, rssi: -55, yaw: 1.1, pitch: -0.2, roll: 0.0),
            TrackerModel(id: 3, name: "Left Thigh", bodyPart: .leftThigh, batteryLevel: 0.79, batteryVoltage: 3.96, ping: 11, rssi: -58, yaw: 0.9, pitch: 12.4, roll: 0.5),
            TrackerModel(id: 4, name: "Right Thigh", bodyPart: .rightThigh, batteryLevel: 0.81, batteryVoltage: 3.98, ping: 10, rssi: -56, yaw: 1.0, pitch: 11.8, roll: -0.4),
            TrackerModel(id: 5, name: "Left Foot", bodyPart: .leftFoot, batteryLevel: 0.74, batteryVoltage: 3.89, ping: 14, rssi: -62, yaw: 0.8, pitch: 0.1, roll: 0.2),
            TrackerModel(id: 6, name: "Right Foot", bodyPart: .rightFoot, batteryLevel: 0.76, batteryVoltage: 3.91, ping: 12, rssi: -60, yaw: 0.8, pitch: -0.1, roll: -0.1),
        ]
    }
}
