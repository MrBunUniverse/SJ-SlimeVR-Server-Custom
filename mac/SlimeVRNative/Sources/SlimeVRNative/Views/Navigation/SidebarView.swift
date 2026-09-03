import SwiftUI

public struct SidebarView: View {
    @ObservedObject public var client: SlimeVRClient
    
    public init(client: SlimeVRClient) {
        self.client = client
    }
    
    public var body: some View {
        List(NavigationTab.allCases, selection: $client.currentTab) { tab in
            NavigationLink(value: tab) {
                Label {
                    HStack {
                        Text(tab.rawValue)
                            .font(.system(size: 13, weight: .medium))
                        
                        Spacer()
                        
                        if tab == .dashboard {
                            Text("\(client.trackers.filter { $0.status == .ok }.count)")
                                .font(.system(size: 10, weight: .bold))
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(Color.emeraldAccent.opacity(0.2))
                                .foregroundColor(.emeraldAccent)
                                .cornerRadius(6)
                                .monospacedDigit()
                        }
                    }
                } icon: {
                    Image(systemName: tab.icon)
                        .foregroundColor(client.currentTab == tab ? .emeraldAccent : .secondary)
                }
            }
        }
        .listStyle(.sidebar)
        .frame(minWidth: 190, idealWidth: 210, maxWidth: 240)
    }
}
