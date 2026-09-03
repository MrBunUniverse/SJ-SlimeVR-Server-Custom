// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "SlimeVRNative",
    platforms: [
        .macOS(.v14)
    ],
    products: [
        .executable(
            name: "SlimeVRNative",
            targets: ["SlimeVRNative"]
        )
    ],
    targets: [
        .executableTarget(
            name: "SlimeVRNative",
            path: "Sources/SlimeVRNative"
        )
    ]
)
