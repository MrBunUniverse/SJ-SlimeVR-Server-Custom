import SwiftUI

public struct TrackerDetailSheet: View {
    public let tracker: TrackerModel
    @ObservedObject public var client: SlimeVRClient
    @Environment(\.dismiss) private var dismiss
    
    @State private var selectedBodyPart: BodyPart
    
    public init(tracker: TrackerModel, client: SlimeVRClient) {
        self.tracker = tracker
        self.client = client
        self._selectedBodyPart = State(initialValue: tracker.bodyPart)
    }
    
    public var body: some View {
        VStack(spacing: 16) {
            // Header
            HStack {
                Image(systemName: tracker.bodyPart.sfSymbol)
                    .font(.system(size: 24, weight: .bold))
                    .foregroundColor(.emeraldAccent)
                
                VStack(alignment: .leading, spacing: 2) {
                    Text(tracker.name)
                        .font(.system(size: 16, weight: .bold))
                    Text("Sensor: \(tracker.imuType) • Status: \(tracker.status.rawValue)")
                        .font(.system(size: 11))
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                Button("Done") {
                    dismiss()
                }
                .keyboardShortcut(.defaultAction)
            }
            .padding(.bottom, 4)
            
            Divider()
            
            // Live Rotation Telemetry (Euler Angles)
            VStack(alignment: .leading, spacing: 8) {
                Text("LIVE ORIENTATION (YXZ EULER)")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(.secondary)
                
                HStack(spacing: 12) {
                    telemetryCard(title: "Yaw", value: String(format: "%.1f°", tracker.yaw))
                    telemetryCard(title: "Pitch", value: String(format: "%.1f°", tracker.pitch))
                    telemetryCard(title: "Roll", value: String(format: "%.1f°", tracker.roll))
                }
            }
            
            // Hardware Status
            VStack(alignment: .leading, spacing: 8) {
                Text("HARDWARE HEALTH")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(.secondary)
                
                HStack(spacing: 12) {
                    telemetryCard(title: "Battery", value: "\(Int((tracker.batteryLevel ?? 0.8) * 100))%")
                    telemetryCard(title: "Voltage", value: String(format: "%.2f V", tracker.batteryVoltage ?? 4.0))
                    telemetryCard(title: "Signal (RSSI)", value: "\(tracker.rssi ?? -55) dBm")
                    telemetryCard(title: "Latency (Ping)", value: "\(tracker.ping ?? 10) ms")
                }
            }
            
            // Body Part Assignment Picker
            VStack(alignment: .leading, spacing: 6) {
                Text("ASSIGN BODY PART")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(.secondary)
                
                Picker("", selection: $selectedBodyPart) {
                    ForEach(BodyPart.allCases) { part in
                        Text(part.rawValue).tag(part)
                    }
                }
                .pickerStyle(.menu)
                .onChange(of: selectedBodyPart) { _, newPart in
                    client.assignTracker(id: tracker.id, to: newPart)
                }
            }
            
            Spacer()
            
            // Actions Footer
            HStack {
                Button("Reset Mounting") {
                    client.triggerReset(type: "mounting")
                    dismiss()
                }
                
                Spacer()
                
                Button("Identify Tracker (Blink LED)") {
                    // Blink LED RPC
                }
            }
        }
        .padding(20)
        .frame(width: 440, height: 420)
        .background(.ultraThinMaterial)
    }
    
    private func telemetryCard(title: String, value: String) -> some View {
        VStack(spacing: 3) {
            Text(title)
                .font(.system(size: 10, weight: .medium))
                .foregroundColor(.secondary)
            Text(value)
                .font(.system(size: 13, weight: .bold))
                .monospacedDigit()
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
        .background(Color.white.opacity(0.04))
        .cornerRadius(8)
        .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(Color.white.opacity(0.06), lineWidth: 1))
    }
}
