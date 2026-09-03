import SwiftUI

public struct MainWindowView: View {
    @StateObject private var client = SlimeVRClient.shared
    
    public init() {}
    
    public var body: some View {
        NavigationSplitView {
            SidebarView(client: client)
        } detail: {
            VStack(spacing: 0) {
                TopToolbarView(client: client)
                
                Group {
                    switch client.currentTab {
                    case .dashboard:
                        DashboardView(client: client)
                    case .assignment:
                        TrackerAssignmentView(client: client)
                    case .proportions:
                        BodyProportionsView(client: client)
                    case .wifi:
                        WiFiProvisioningView(client: client)
                    case .settings:
                        SettingsView(client: client)
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                
                // Footer Status Bar
                HStack {
                    Circle()
                        .fill(client.isConnected ? Color.emeraldAccent : Color.orange)
                        .frame(width: 6, height: 6)
                    
                    Text(client.statusMessage)
                        .font(.system(size: 10.5, weight: .medium))
                        .foregroundColor(.secondary)
                    
                    Spacer()
                    
                    Text("SlimeVR Native 1:1 Engine • macOS Sequoia")
                        .font(.system(size: 10))
                        .foregroundColor(.secondary.opacity(0.7))
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(.ultraThinMaterial)
            }
        }
        .frame(minWidth: 840, minHeight: 620)
        .background(Color.black.opacity(0.12))
    }
}
