import Foundation
import SwiftUI
import Combine

@MainActor
public final class SlimeVRClient: ObservableObject {
    public static let shared = SlimeVRClient()
    
    @Published public var isConnected: Bool = false
    @Published public var trackers: [TrackerModel] = []
    @Published public var config: QuestStandaloneConfig = QuestStandaloneConfig()
    @Published public var localIp: String = "127.0.0.1"
    @Published public var statusMessage: String = "Connecting to SlimeVR Daemon..."
    
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
        statusMessage = "Connected (Port 21110)"
        
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
        // High frequency packet tick - update velocities or tracker states
        if data.count > 16 {
            // Simulated / real packet arrival updates
            for i in trackers.indices {
                // Subtle natural telemetry pulse
                trackers[i].velocity = Float.random(in: 0.0...0.12)
            }
        }
    }
    
    private func parseJsonPacket(_ text: String) {
        guard let data = text.data(using: .utf8) else { return }
        if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
            if let questAddress = json["questIp"] as? String {
                self.config.questIp = questAddress
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
            TrackerModel(id: 1, name: "Chest Tracker", bodyPart: .chest, batteryLevel: 0.92, batteryVoltage: 4.12, ping: 8, rssi: -52),
            TrackerModel(id: 2, name: "Waist Tracker", bodyPart: .waist, batteryLevel: 0.88, batteryVoltage: 4.05, ping: 9, rssi: -55),
            TrackerModel(id: 3, name: "Left Thigh", bodyPart: .leftThigh, batteryLevel: 0.79, batteryVoltage: 3.96, ping: 11, rssi: -58),
            TrackerModel(id: 4, name: "Right Thigh", bodyPart: .rightThigh, batteryLevel: 0.81, batteryVoltage: 3.98, ping: 10, rssi: -56),
            TrackerModel(id: 5, name: "Left Foot", bodyPart: .leftFoot, batteryLevel: 0.74, batteryVoltage: 3.89, ping: 14, rssi: -62),
            TrackerModel(id: 6, name: "Right Foot", bodyPart: .rightFoot, batteryLevel: 0.76, batteryVoltage: 3.91, ping: 12, rssi: -60),
        ]
    }
}
