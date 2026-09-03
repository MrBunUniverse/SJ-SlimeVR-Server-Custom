import SwiftUI
import AppKit

@main
struct SlimeVRApp: App {
    @StateObject private var client = SlimeVRClient.shared
    
    init() {
        // Prevent macOS from putting the system or Wi-Fi to sleep during VR tracking
        PowerAssertionManager.shared.preventSleep(reason: "SlimeVR Native Live Tracking")
    }
    
    var body: some Scene {
        WindowGroup {
            MainWindowView()
                .environmentObject(client)
        }
        .windowStyle(.hiddenTitleBar)
        .windowToolbarStyle(.unified)
        .defaultSize(width: 820, height: 640)
        
        MenuBarExtra {
            SlimeVRMenuBarView(client: client)
        } label: {
            HStack(spacing: 4) {
                Image(systemName: "figure.walk.motion")
                Text("\(client.trackers.filter { $0.status == .ok }.count)")
                    .monospacedDigit()
            }
        }
        .menuBarExtraStyle(.window)
    }
}
