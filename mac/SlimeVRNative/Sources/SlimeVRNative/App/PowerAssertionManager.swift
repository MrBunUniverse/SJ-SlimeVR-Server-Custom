import Foundation

public final class PowerAssertionManager: @unchecked Sendable {
    public static let shared = PowerAssertionManager()
    
    private var activityToken: NSObjectProtocol?
    private let lock = NSLock()
    
    private init() {}
    
    public func preventSleep(reason: String = "SlimeVR Native VR Tracking Active") {
        lock.lock()
        defer { lock.unlock() }
        
        guard activityToken == nil else { return }
        
        activityToken = ProcessInfo.processInfo.beginActivity(
            options: [.idleSystemSleepDisabled, .suddenTerminationDisabled],
            reason: reason
        )
        print("[PowerAssertionManager] Prevented macOS system & Wi-Fi sleep: \(reason)")
    }
    
    public func allowSleep() {
        lock.lock()
        defer { lock.unlock() }
        
        if let token = activityToken {
            ProcessInfo.processInfo.endActivity(token)
            activityToken = nil
            print("[PowerAssertionManager] Released sleep prevention assertion")
        }
    }
}
