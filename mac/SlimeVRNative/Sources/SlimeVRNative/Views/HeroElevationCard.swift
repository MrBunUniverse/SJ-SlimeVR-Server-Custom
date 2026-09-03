import SwiftUI

public struct HeroElevationCard: View {
    @ObservedObject public var client: SlimeVRClient
    @State private var showAdvancedTuning: Bool = false
    @State private var correctionStrength: Float = 0.5
    @State private var footPlantStrength: Float = 0.5
    @State private var crouchCompensation: Bool = true
    
    public init(client: SlimeVRClient) {
        self.client = client
    }
    
    public var body: some View {
        VStack(spacing: 12) {
            // Header Bar
            HStack {
                HStack(spacing: 6) {
                    Circle()
                        .fill(client.isConnected ? Color.emeraldAccent : Color.orange)
                        .frame(width: 8, height: 8)
                        .shadow(color: client.isConnected ? Color.emeraldAccent.opacity(0.6) : Color.clear, radius: 4)
                    
                    Text("Quest Telemetry & Floor")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundColor(.primary)
                }
                
                Spacer()
                
                // Scan for Trackers Button
                Button(action: {
                    client.refreshTrackers()
                }) {
                    HStack(spacing: 4) {
                        Image(systemName: "arrow.clockwise")
                            .font(.system(size: 10, weight: .bold))
                        Text("Scan Trackers")
                            .font(.system(size: 11, weight: .medium))
                    }
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.white.opacity(0.06))
                    .cornerRadius(8)
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .strokeBorder(Color.white.opacity(0.1), lineWidth: 1)
                    )
                }
                .buttonStyle(.plain)
            }
            .padding(.bottom, 2)
            
            // 4-Tile Responsive Metric Grid
            HStack(spacing: 10) {
                // Tile 1: Active Profile
                metricTile(title: "Active Preset") {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("6-Point Full Body")
                            .font(.system(size: 13, weight: .bold))
                            .lineLimit(1)
                        Text("\(client.trackers.filter { $0.status == .ok }.count) of 6 Active")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundColor(.emeraldAccent)
                            .monospacedDigit()
                    }
                }
                
                // Tile 2: Tactile Elevation Scrubber
                metricTile(title: "Elevation") {
                    VStack(spacing: 6) {
                        HStack {
                            if Int(round(client.config.floorHeight * 100)) != 0 {
                                Button("Reset 0") {
                                    client.setFloorHeight(meters: 0.0)
                                }
                                .font(.system(size: 9.5, weight: .bold))
                                .padding(.horizontal, 5)
                                .padding(.vertical, 2)
                                .background(Color.white.opacity(0.12))
                                .cornerRadius(5)
                                .buttonStyle(.plain)
                            }
                            
                            Spacer()
                            
                            Text(elevationFormatted)
                                .font(.system(size: 13, weight: .bold))
                                .foregroundColor(.primary)
                                .monospacedDigit()
                        }
                        
                        // Scrubber with [-1cm] and [+1cm] buttons
                        HStack(spacing: 6) {
                            Button("-1") {
                                client.adjustFloorHeight(deltaCm: -1)
                            }
                            .font(.system(size: 10, weight: .bold))
                            .frame(width: 22, height: 20)
                            .background(Color.white.opacity(0.1))
                            .cornerRadius(6)
                            .buttonStyle(.plain)
                            
                            // Slider
                            Slider(
                                value: Binding(
                                    get: { Double(client.config.floorHeight * 100) },
                                    set: { client.setFloorHeight(meters: Float($0) / 100.0) }
                                ),
                                in: -150...200,
                                step: 1
                            )
                            .tint(.emeraldAccent)
                            
                            Button("+1") {
                                client.adjustFloorHeight(deltaCm: 1)
                            }
                            .font(.system(size: 10, weight: .bold))
                            .frame(width: 22, height: 20)
                            .background(Color.white.opacity(0.1))
                            .cornerRadius(6)
                            .buttonStyle(.plain)
                        }
                        
                        HStack {
                            Text("-150cm").font(.system(size: 8.5)).foregroundColor(.secondary)
                            Spacer()
                            Text("0cm (Floor)").font(.system(size: 8.5, weight: .bold)).foregroundColor(.secondary)
                            Spacer()
                            Text("+200cm (Fly)").font(.system(size: 8.5)).foregroundColor(.secondary)
                        }
                    }
                }
                
                // Tile 3: OSC Output Rate
                metricTile(title: "OSC Rate") {
                    VStack(spacing: 6) {
                        HStack(spacing: 4) {
                            ForEach([30, 50, 60, 90], id: \.self) { rate in
                                Button("\(rate)Hz") {
                                    client.setOscRate(hz: rate)
                                }
                                .font(.system(size: 10.5, weight: client.config.oscRate == rate ? .bold : .medium))
                                .padding(.vertical, 4)
                                .frame(maxWidth: .infinity)
                                .background(client.config.oscRate == rate ? Color.emeraldAccent : Color.white.opacity(0.06))
                                .foregroundColor(client.config.oscRate == rate ? .white : .secondary)
                                .cornerRadius(6)
                                .buttonStyle(.plain)
                            }
                        }
                        
                        Text("VRChat Quest Stream")
                            .font(.system(size: 9.5))
                            .foregroundColor(.secondary)
                    }
                }
                
                // Tile 4: Floor Anchor Status
                metricTile(title: "Floor Anchor") {
                    VStack(alignment: .leading, spacing: 4) {
                        HStack {
                            Text(client.config.isAnchored ? "Locked" : "Floating")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundColor(client.config.isAnchored ? .emeraldAccent : .orange)
                            
                            Spacer()
                            
                            Button(client.config.isAnchored ? "Unlock" : "Lock") {
                                client.config.isAnchored.toggle()
                            }
                            .font(.system(size: 9.5, weight: .semibold))
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.white.opacity(0.08))
                            .cornerRadius(5)
                            .buttonStyle(.plain)
                        }
                        
                        Text("Headset height grounded")
                            .font(.system(size: 9.5))
                            .foregroundColor(.secondary)
                    }
                }
            }
            
            // Progressive Disclosure Tuning Toggle
            Button(action: {
                withAnimation(.spring(response: 0.35, dampingFraction: 0.73)) {
                    showAdvancedTuning.toggle()
                }
            }) {
                HStack(spacing: 4) {
                    Image(systemName: showAdvancedTuning ? "chevron.up" : "chevron.down")
                        .font(.system(size: 9, weight: .bold))
                    Text(showAdvancedTuning ? "Hide Advanced Calibration" : "Advanced Calibration & Leg Tweaks")
                        .font(.system(size: 11, weight: .medium))
                }
                .foregroundColor(.secondary)
                .padding(.top, 2)
            }
            .buttonStyle(.plain)
            
            // Advanced Tuning Drawer
            if showAdvancedTuning {
                HStack(spacing: 16) {
                    VStack(alignment: .leading, spacing: 4) {
                        HStack {
                            Text("Correction Strength").font(.system(size: 11)).foregroundColor(.secondary)
                            Spacer()
                            Text("\(Int(correctionStrength * 100))%").font(.system(size: 11, weight: .bold)).monospacedDigit()
                        }
                        Slider(value: $correctionStrength, in: 0...1).tint(.emeraldAccent)
                    }
                    
                    VStack(alignment: .leading, spacing: 4) {
                        HStack {
                            Text("Foot Plant Lock").font(.system(size: 11)).foregroundColor(.secondary)
                            Spacer()
                            Text("\(Int(footPlantStrength * 100))%").font(.system(size: 11, weight: .bold)).monospacedDigit()
                        }
                        Slider(value: $footPlantStrength, in: 0...1).tint(.emeraldAccent)
                    }
                    
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Crouch Compensation").font(.system(size: 11, weight: .semibold))
                            Text("Preserve foot lock").font(.system(size: 9.5)).foregroundColor(.secondary)
                        }
                        Spacer()
                        Toggle("", isOn: $crouchCompensation).labelsHidden().toggleStyle(SwitchToggleStyle(tint: .emeraldAccent))
                    }
                }
                .padding(10)
                .background(Color.black.opacity(0.2))
                .cornerRadius(12)
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .strokeBorder(Color.white.opacity(0.06), lineWidth: 1)
                )
            }
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .fill(.ultraThinMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: 24, style: .continuous)
                        .strokeBorder(
                            LinearGradient(
                                colors: [Color.white.opacity(0.18), Color.white.opacity(0.04)],
                                startPoint: .top,
                                endPoint: .bottom
                            ),
                            lineWidth: 1
                        )
                )
                .shadow(color: Color.black.opacity(0.25), radius: 16, x: 0, y: 8)
        )
    }
    
    private var elevationFormatted: String {
        let cm = Int(round(client.config.floorHeight * 100))
        return "\(cm >= 0 ? "+" : "")\(cm) cm"
    }
    
    private func metricTile<Content: View>(title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title.uppercased())
                .font(.system(size: 9.5, weight: .bold))
                .foregroundColor(.secondary)
            
            content()
            
            Spacer(minLength: 0)
        }
        .padding(10)
        .frame(maxWidth: .infinity, alignment: .topLeading)
        .frame(height: 86)
        .background(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(Color.white.opacity(0.04))
                .overlay(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .strokeBorder(Color.white.opacity(0.08), lineWidth: 1)
                )
        )
    }
}
