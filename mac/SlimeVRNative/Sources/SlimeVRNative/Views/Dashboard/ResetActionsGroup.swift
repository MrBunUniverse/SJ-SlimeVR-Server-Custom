import SwiftUI

public struct ResetActionsGroup: View {
    @ObservedObject public var client: SlimeVRClient
    
    public init(client: SlimeVRClient) {
        self.client = client
    }
    
    public var body: some View {
        HStack(spacing: 8) {
            // Full Reset Button
            Button(action: {
                client.triggerReset(type: "full")
            }) {
                HStack(spacing: 6) {
                    Image(systemName: "arrow.counterclockwise.circle.fill")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(.emeraldAccent)
                    
                    if client.countdownRemaining > 0 {
                        Text("Resetting in \(client.countdownRemaining)s...")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.emeraldAccent)
                    } else {
                        Text("Full Reset")
                            .font(.system(size: 11.5, weight: .semibold))
                    }
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(Color.white.opacity(0.06))
                .cornerRadius(10)
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .strokeBorder(Color.white.opacity(0.1), lineWidth: 1)
                )
            }
            .buttonStyle(.plain)
            
            // Yaw Reset Button
            Button(action: {
                client.triggerReset(type: "yaw")
            }) {
                HStack(spacing: 5) {
                    Image(systemName: "arrow.left.and.right.circle")
                        .font(.system(size: 12))
                    Text("Yaw Reset")
                        .font(.system(size: 11.5, weight: .medium))
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(Color.white.opacity(0.04))
                .cornerRadius(10)
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .strokeBorder(Color.white.opacity(0.08), lineWidth: 1)
                )
            }
            .buttonStyle(.plain)
            
            // Mounting Reset Button
            Button(action: {
                client.triggerReset(type: "mounting")
            }) {
                HStack(spacing: 5) {
                    Image(systemName: "figure.skiing.downhill")
                        .font(.system(size: 12))
                    Text("Mounting Reset")
                        .font(.system(size: 11.5, weight: .medium))
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(Color.white.opacity(0.04))
                .cornerRadius(10)
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .strokeBorder(Color.white.opacity(0.08), lineWidth: 1)
                )
            }
            .buttonStyle(.plain)
        }
        .padding(4)
        .background(.ultraThinMaterial)
        .cornerRadius(14)
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .strokeBorder(Color.white.opacity(0.06), lineWidth: 1)
        )
    }
}
