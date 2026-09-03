import SwiftUI

public struct SlimeVRMenuBarView: View {
    @ObservedObject public var client: SlimeVRClient
    
    public init(client: SlimeVRClient) {
        self.client = client
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            // Header
            HStack {
                Image(systemName: "figure.walk.motion")
                    .foregroundColor(.emeraldAccent)
                Text("SlimeVR Native")
                    .font(.system(size: 12, weight: .bold))
                
                Spacer()
                
                Circle()
                    .fill(client.isConnected ? Color.emeraldAccent : Color.orange)
                    .frame(width: 6, height: 6)
            }
            .padding(.bottom, 2)
            
            Divider()
            
            // Quest IP Status
            HStack {
                Text("Quest Target:")
                    .font(.system(size: 11))
                    .foregroundColor(.secondary)
                Spacer()
                Text(client.config.questIp)
                    .font(.system(size: 11, weight: .bold))
                    .monospacedDigit()
            }
            
            // Quick Elevation Steppers
            HStack {
                Text("Elevation:")
                    .font(.system(size: 11))
                    .foregroundColor(.secondary)
                
                Spacer()
                
                Button("-1cm") {
                    client.adjustFloorHeight(deltaCm: -1)
                }
                .font(.system(size: 10, weight: .bold))
                
                Text("\(Int(round(client.config.floorHeight * 100)))cm")
                    .font(.system(size: 11, weight: .bold))
                    .monospacedDigit()
                
                Button("+1cm") {
                    client.adjustFloorHeight(deltaCm: 1)
                }
                .font(.system(size: 10, weight: .bold))
            }
            
            Divider()
            
            // Trackers Summary
            VStack(alignment: .leading, spacing: 4) {
                Text("Connected Trackers (\(client.trackers.count)):")
                    .font(.system(size: 10.5, weight: .semibold))
                    .foregroundColor(.secondary)
                
                ForEach(client.trackers.prefix(4)) { tracker in
                    HStack {
                        Image(systemName: tracker.bodyPart.sfSymbol)
                            .font(.system(size: 10))
                        Text(tracker.name)
                            .font(.system(size: 10.5))
                        Spacer()
                        if let battery = tracker.batteryLevel {
                            Text("\(Int(battery * 100))%")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(.emeraldAccent)
                                .monospacedDigit()
                        }
                    }
                }
            }
            
            Divider()
            
            // Actions
            HStack {
                Button("Scan Trackers") {
                    client.refreshTrackers()
                }
                .font(.system(size: 11))
                
                Spacer()
                
                Button("Quit") {
                    NSApplication.shared.terminate(nil)
                }
                .font(.system(size: 11))
                .foregroundColor(.red)
            }
        }
        .padding(12)
        .frame(width: 250)
    }
}
