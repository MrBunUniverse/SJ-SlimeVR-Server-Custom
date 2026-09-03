import SwiftUI

public struct TrackerGridView: View {
    public let trackers: [TrackerModel]
    
    private let columns = [
        GridItem(.adaptive(minimum: 220, maximum: 300), spacing: 12)
    ]
    
    public init(trackers: [TrackerModel]) {
        self.trackers = trackers
    }
    
    public var body: some View {
        LazyVGrid(columns: columns, spacing: 12) {
            ForEach(trackers) { tracker in
                TrackerCardView(tracker: tracker)
            }
        }
    }
}

public struct TrackerCardView: View {
    public let tracker: TrackerModel
    
    public init(tracker: TrackerModel) {
        self.tracker = tracker
    }
    
    public var body: some View {
        HStack(spacing: 12) {
            // Body Part Icon Frame with Motion Glow
            ZStack {
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .fill(Color.white.opacity(0.06))
                    .frame(width: 44, height: 44)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                            .strokeBorder(
                                tracker.isMoving ? Color.skyAccent : Color.white.opacity(0.1),
                                lineWidth: tracker.isMoving ? 2 : 1
                            )
                    )
                    .shadow(
                        color: tracker.isMoving ? Color.skyAccent.opacity(0.6) : Color.clear,
                        radius: tracker.isMoving ? 8 : 0
                    )
                
                Image(systemName: tracker.bodyPart.sfSymbol)
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundColor(tracker.isMoving ? .skyAccent : .primary)
            }
            
            // Name & Status
            VStack(alignment: .leading, spacing: 3) {
                Text(tracker.name)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(.primary)
                    .lineLimit(1)
                
                HStack(spacing: 4) {
                    Circle()
                        .fill(tracker.status == .ok ? Color.emeraldAccent : Color.orange)
                        .frame(width: 6, height: 6)
                    
                    Text(tracker.status.rawValue)
                        .font(.system(size: 10, weight: .bold))
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
            
            // Battery & Wifi Metrics
            VStack(alignment: .trailing, spacing: 4) {
                if let battery = tracker.batteryLevel {
                    HStack(spacing: 3) {
                        Image(systemName: batteryIcon(for: battery))
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(batteryColor(for: battery))
                        
                        Text("\(Int(battery * 100))%")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.primary)
                            .monospacedDigit()
                    }
                }
                
                if let ping = tracker.ping {
                    Text("\(ping)ms")
                        .font(.system(size: 9.5, weight: .medium))
                        .foregroundColor(.secondary)
                        .monospacedDigit()
                }
            }
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(.ultraThinMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: 20, style: .continuous)
                        .strokeBorder(
                            tracker.isMoving
                                ? Color.skyAccent.opacity(0.5)
                                : Color.white.opacity(0.08),
                            lineWidth: 1
                        )
                )
                .shadow(
                    color: tracker.isMoving ? Color.skyAccent.opacity(0.2) : Color.black.opacity(0.12),
                    radius: 8,
                    x: 0,
                    y: 4
                )
        )
    }
    
    private func batteryIcon(for level: Float) -> String {
        if level > 0.8 { return "battery.100" }
        if level > 0.5 { return "battery.75" }
        if level > 0.2 { return "battery.25" }
        return "battery.0"
    }
    
    private func batteryColor(for level: Float) -> Color {
        if level > 0.4 { return .emeraldAccent }
        if level > 0.2 { return .orange }
        return .red
    }
}
