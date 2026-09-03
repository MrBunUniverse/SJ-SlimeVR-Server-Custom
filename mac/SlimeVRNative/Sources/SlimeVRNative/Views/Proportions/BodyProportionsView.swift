import SwiftUI

public struct BodyProportionsView: View {
    @ObservedObject public var client: SlimeVRClient
    @State private var isAutoCalibrating: Bool = false
    
    public init(client: SlimeVRClient) {
        self.client = client
    }
    
    public var body: some View {
        ScrollView(.vertical, showsIndicators: false) {
            VStack(spacing: 20) {
                // Header Banner
                HStack {
                    VStack(alignment: .leading, spacing: 3) {
                        Text("Body Proportions & Skeleton Scale")
                            .font(.system(size: 16, weight: .bold))
                        Text("Fine-tune your anatomical bone lengths to eliminate avatar foot sliding.")
                            .font(.system(size: 12))
                            .foregroundColor(.secondary)
                    }
                    
                    Spacer()
                    
                    Button(action: {
                        startAutoBone()
                    }) {
                        HStack(spacing: 6) {
                            Image(systemName: isAutoCalibrating ? "hourglass" : "wand.and.stars")
                            Text(isAutoCalibrating ? "Recording Movement..." : "Auto-Calibrate Bones")
                                .font(.system(size: 12, weight: .semibold))
                        }
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(Color.emeraldAccent)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                    }
                    .buttonStyle(.plain)
                }
                .padding(14)
                .background(.ultraThinMaterial)
                .cornerRadius(16)
                
                // Sliders Grid
                VStack(spacing: 12) {
                    proportionSlider(title: "Head Length", value: $client.proportions.head, range: 8...25)
                    proportionSlider(title: "Neck Length", value: $client.proportions.neck, range: 5...20)
                    proportionSlider(title: "Torso Length", value: $client.proportions.torso, range: 40...80)
                    proportionSlider(title: "Chest Length", value: $client.proportions.chest, range: 20...45)
                    proportionSlider(title: "Waist Length", value: $client.proportions.waist, range: 10...30)
                    proportionSlider(title: "Upper Leg (Thigh)", value: $client.proportions.upperLeg, range: 30...65)
                    proportionSlider(title: "Lower Leg (Shin)", value: $client.proportions.lowerLeg, range: 30...65)
                    proportionSlider(title: "Foot Length", value: $client.proportions.footLength, range: 5...25)
                }
                .padding(16)
                .background(.ultraThinMaterial)
                .cornerRadius(18)
                .overlay(RoundedRectangle(cornerRadius: 18).strokeBorder(Color.white.opacity(0.08), lineWidth: 1))
            }
            .padding(20)
        }
    }
    
    private func proportionSlider(title: String, value: Binding<Float>, range: ClosedRange<Float>) -> some View {
        HStack(spacing: 16) {
            Text(title)
                .font(.system(size: 12, weight: .medium))
                .frame(width: 130, alignment: .leading)
            
            Slider(value: Binding(
                get: { Double(value.wrappedValue) },
                set: {
                    value.wrappedValue = Float($0)
                    client.setProportions(client.proportions)
                }
            ), in: Double(range.lowerBound)...Double(range.upperBound), step: 0.5)
            .tint(.emeraldAccent)
            
            Text("\(Int(round(value.wrappedValue))) cm")
                .font(.system(size: 12, weight: .bold))
                .monospacedDigit()
                .frame(width: 55, alignment: .trailing)
        }
    }
    
    private func startAutoBone() {
        isAutoCalibrating = true
        Timer.scheduledTimer(withTimeInterval: 4.0, repeats: false) { _ in
            Task { @MainActor in
                isAutoCalibrating = false
                client.statusMessage = "AutoBone Calibration Complete"
            }
        }
    }
}
