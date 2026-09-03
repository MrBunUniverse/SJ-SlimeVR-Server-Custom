import SwiftUI

public struct DashboardView: View {
    @ObservedObject public var client: SlimeVRClient
    
    public init(client: SlimeVRClient) {
        self.client = client
    }
    
    public var body: some View {
        ScrollView(.vertical, showsIndicators: false) {
            VStack(spacing: 16) {
                // Top Hero Telemetry & Flight Elevation
                HeroElevationCard(client: client)
                
                // 3D Skeleton Visualizer & Quick Resets Row
                HStack(alignment: .top, spacing: 14) {
                    SkeletonVisualizer3DView(client: client)
                        .frame(maxWidth: .infinity)
                    
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Quick Resets & Alignment")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(.secondary)
                        
                        ResetActionsGroup(client: client)
                        
                        Spacer()
                    }
                    .frame(width: 230)
                }
                
                // Trackers Header & Grid
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text("Connected Trackers (\(client.trackers.count))")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundColor(.secondary)
                        
                        Spacer()
                        
                        Text("Click any tracker to inspect telemetry")
                            .font(.system(size: 10.5))
                            .foregroundColor(.secondary.opacity(0.7))
                    }
                    
                    TrackerGridView(trackers: client.trackers) { tracker in
                        client.selectedTracker = tracker
                    }
                }
            }
            .padding(16)
        }
        .sheet(item: $client.selectedTracker) { tracker in
            TrackerDetailSheet(tracker: tracker, client: client)
        }
    }
}
