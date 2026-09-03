import SwiftUI

public struct MainWindowView: View {
    @StateObject private var client = SlimeVRClient.shared
    
    public init() {}
    
    public var body: some View {
        VStack(spacing: 0) {
            // Unified macOS 52pt Toolbar
            HStack(spacing: 12) {
                // Brand Header
                HStack(spacing: 8) {
                    Image(systemName: "figure.walk.motion")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(.emeraldAccent)
                    
                    Text("SlimeVR Native")
                        .font(.system(size: 13.5, weight: .bold))
                        .foregroundColor(.primary)
                }
                .padding(.leading, 8)
                
                // Host IP Capsule
                HStack(spacing: 4) {
                    Circle().fill(Color.skyAccent).frame(width: 5, height: 5)
                    Text("MAC: \(client.localIp)")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(.secondary)
                        .monospacedDigit()
                }
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color.white.opacity(0.04))
                .cornerRadius(8)
                .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(Color.white.opacity(0.08), lineWidth: 1))
                
                // Quest IP Pill
                HStack(spacing: 4) {
                    Circle().fill(Color.emeraldAccent).frame(width: 5, height: 5)
                    Text("QUEST: \(client.config.questIp)")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(.primary)
                        .monospacedDigit()
                }
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color.emeraldAccent.opacity(0.12))
                .cornerRadius(8)
                .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(Color.emeraldAccent.opacity(0.3), lineWidth: 1))
                
                Spacer()
                
                // Standalone Mode Switch
                StandaloneToggle(isStandalone: $client.config.isStandalone) { enabled in
                    client.toggleStandalone(enabled: enabled)
                }
            }
            .frame(height: 52)
            .padding(.horizontal, 16)
            .background(.ultraThinMaterial)
            .overlay(
                Rectangle()
                    .fill(Color.white.opacity(0.08))
                    .frame(height: 1),
                alignment: .bottom
            )
            
            // Main Content Area
            ScrollView(.vertical, showsIndicators: false) {
                VStack(spacing: 16) {
                    HeroElevationCard(client: client)
                    
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Text("Active Trackers (\(client.trackers.count))")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundColor(.secondary)
                            
                            Spacer()
                        }
                        
                        TrackerGridView(trackers: client.trackers)
                    }
                }
                .padding(16)
            }
            
            // Status Footer Bar
            HStack {
                Circle()
                    .fill(client.isConnected ? Color.emeraldAccent : Color.orange)
                    .frame(width: 6, height: 6)
                
                Text(client.statusMessage)
                    .font(.system(size: 10.5, weight: .medium))
                    .foregroundColor(.secondary)
                
                Spacer()
                
                Text("SwiftUI Native Engine • macOS Sequoia")
                    .font(.system(size: 10))
                    .foregroundColor(.secondary.opacity(0.7))
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background(.ultraThinMaterial)
        }
        .frame(minWidth: 720, minHeight: 560)
        .background(Color.black.opacity(0.15))
    }
}
