import Foundation
import SwiftUI

public enum TrackerStatus: String, Codable, Sendable {
    case disconnected = "DISCONNECTED"
    case ok = "OK"
    case busy = "BUSY"
    case error = "ERROR"
    case timedOut = "TIMED_OUT"
}

public enum BodyPart: String, Codable, CaseIterable, Sendable {
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
    
    public var sfSymbol: String {
        switch self {
        case .head: return "person.crop.circle"
        case .chest: return "shield.fill"
        case .waist, .hip: return "figure.stand"
        case .leftThigh, .rightThigh: return "figure.walk"
        case .leftFoot, .rightFoot: return "shoeprints.fill"
        case .leftUpperArm, .rightUpperArm: return "hand.raised.fill"
        }
    }
}

public struct TrackerModel: Identifiable, Sendable {
    public let id: Int
    public var name: String
    public var bodyPart: BodyPart
    public var status: TrackerStatus
    public var batteryLevel: Float? // 0.0 to 1.0
    public var batteryVoltage: Float? // e.g. 3.92V
    public var ping: Int? // ms
    public var rssi: Int? // dBm
    public var velocity: Float // m/s
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
        velocity: Float = 0.0
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
    }
}

public struct QuestStandaloneConfig: Sendable {
    public var isStandalone: Bool = true
    public var floorHeight: Float = 0.0 // in meters (-1.5m to +2.0m)
    public var oscRate: Int = 60 // 30, 50, 60, 90 Hz
    public var isAnchored: Bool = true
    public var questIp: String = "192.168.1.150"
    
    public init() {}
}
