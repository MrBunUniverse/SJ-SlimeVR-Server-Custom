import Foundation
import SwiftUI

public enum NavigationTab: String, CaseIterable, Identifiable, Sendable {
    case dashboard = "Dashboard"
    case assignment = "Body Assignment"
    case proportions = "Body Proportions"
    case wifi = "Wi-Fi & Hardware"
    case settings = "Settings & OSC"
    
    public var id: String { rawValue }
    
    public var icon: String {
        switch self {
        case .dashboard: return "gauge.with.needle.fill"
        case .assignment: return "figure.stand"
        case .proportions: return "ruler.fill"
        case .wifi: return "wifi"
        case .settings: return "gearshape.fill"
        }
    }
}

public enum TrackerStatus: String, Codable, Sendable {
    case disconnected = "DISCONNECTED"
    case ok = "OK"
    case busy = "BUSY"
    case error = "ERROR"
    case timedOut = "TIMED_OUT"
}

public enum BodyPart: String, Codable, CaseIterable, Identifiable, Sendable {
    case head = "Head"
    case chest = "Chest"
    case waist = "Waist"
    case hip = "Hip"
    case leftThigh = "Left Thigh"
    case rightThigh = "Right Thigh"
    case leftFoot = "Left Foot"
    case rightFoot = "Right Foot"
    case leftUpperArm = "Left Arm"
    case rightUpperArm = "Right Arm"
    case unassigned = "Unassigned"
    
    public var id: String { rawValue }
    
    public var sfSymbol: String {
        switch self {
        case .head: return "person.crop.circle"
        case .chest: return "shield.fill"
        case .waist, .hip: return "figure.stand"
        case .leftThigh, .rightThigh: return "figure.walk"
        case .leftFoot, .rightFoot: return "shoeprints.fill"
        case .leftUpperArm, .rightUpperArm: return "hand.raised.fill"
        case .unassigned: return "questionmark.circle"
        }
    }
}

public struct TrackerModel: Identifiable, Sendable {
    public let id: Int
    public var name: String
    public var bodyPart: BodyPart
    public var status: TrackerStatus
    public var batteryLevel: Float? // 0.0 to 1.0
    public var batteryVoltage: Float? // e.g. 4.02V
    public var ping: Int? // ms
    public var rssi: Int? // dBm
    public var velocity: Float // m/s
    public var yaw: Float = 0.0
    public var pitch: Float = 0.0
    public var roll: Float = 0.0
    public var imuType: String = "BNO085"
    public var isMoving: Bool { velocity > 0.18 }
    
    public init(
        id: Int,
        name: String,
        bodyPart: BodyPart,
        status: TrackerStatus = .ok,
        batteryLevel: Float? = 0.85,
        batteryVoltage: Float? = 4.02,
        ping: Int? = 12,
        rssi: Int? = -58,
        velocity: Float = 0.0,
        yaw: Float = 0.0,
        pitch: Float = 0.0,
        roll: Float = 0.0,
        imuType: String = "BNO085"
    ) {
        self.id = id
        self.name = name
        self.bodyPart = bodyPart
        self.status = status
        self.batteryLevel = batteryLevel
        self.batteryVoltage = batteryVoltage
        self.ping = ping
        self.rssi = rssi
        self.velocity = velocity
        self.yaw = yaw
        self.pitch = pitch
        self.roll = roll
        self.imuType = imuType
    }
}

public struct QuestStandaloneConfig: Sendable {
    public var isStandalone: Bool = true
    public var floorHeight: Float = 0.0 // in meters (-1.5m to +2.0m)
    public var oscRate: Int = 60 // 30, 50, 60, 90 Hz
    public var isAnchored: Bool = true
    public var questIp: String = "192.168.1.150"
    public var portIn: Int = 9001
    public var portOut: Int = 9000
    public var oscqueryEnabled: Bool = true
    
    public init() {}
}

public struct BoneProportions: Sendable {
    public var head: Float = 15.0
    public var neck: Float = 10.0
    public var torso: Float = 60.0
    public var chest: Float = 35.0
    public var waist: Float = 20.0
    public var hipWidth: Float = 26.0
    public var upperLeg: Float = 45.0
    public var lowerLeg: Float = 45.0
    public var footLength: Float = 12.0
    
    public init() {}
}

public struct LegTweaksConfig: Sendable {
    public var floorClip: Bool = true
    public var skatingCorrection: Bool = true
    public var footPlant: Bool = true
    public var correctionStrength: Float = 0.5
    public var footPlantStrength: Float = 0.5
    public var crouchCompensation: Bool = true
    
    public init() {}
}

public enum FilteringType: String, CaseIterable, Identifiable, Sendable {
    case none = "None"
    case smoothing = "Smoothing"
    case prediction = "Prediction"
    
    public var id: String { rawValue }
}
