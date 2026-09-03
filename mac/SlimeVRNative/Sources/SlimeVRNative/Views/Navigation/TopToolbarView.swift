import SwiftUI

public struct TopToolbarView: View {
    @ObservedObject public var client: SlimeVRClient
    
    public init(client: SlimeVRClient) {
        self.client = client
    }
    
    public var body: some View {
        HStack(spacing: 12) {
            // Local IP Capsule
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
            
            // Quest IP Capsule
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
        .padding(.horizontal, 16)
        .frame(height: 50)
        .background(.ultraThinMaterial)
        .overlay(
            Rectangle().fill(Color.white.opacity(0.08)).frame(height: 1),
            alignment: .bottom
        )
    }
}
