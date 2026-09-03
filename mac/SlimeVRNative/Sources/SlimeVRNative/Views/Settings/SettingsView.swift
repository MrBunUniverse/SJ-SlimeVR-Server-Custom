import SwiftUI

public struct SettingsView: View {
    @ObservedObject public var client: SlimeVRClient
    
    public init(client: SlimeVRClient) {
        self.client = client
    }
    
    public var body: some View {
        ScrollView(.vertical, showsIndicators: false) {
            VStack(spacing: 20) {
                // Section 1: VRChat OSC Standalone Config
                settingsSection(title: "VRCHAT OSC & STANDALONE") {
                    VStack(spacing: 12) {
                        HStack {
                            Text("Quest Headset IP Address")
                                .font(.system(size: 12, weight: .medium))
                            Spacer()
                            TextField("192.168.1.xxx", text: $client.config.questIp)
                                .textFieldStyle(.roundedBorder)
                                .frame(width: 160)
                                .monospacedDigit()
                        }
                        
                        HStack {
                            Text("OSC Output Port (To Quest)")
                                .font(.system(size: 12, weight: .medium))
                            Spacer()
                            Text("\(client.config.portOut)")
                                .font(.system(size: 12, weight: .bold))
                                .monospacedDigit()
                                .foregroundColor(.secondary)
                        }
                        
                        HStack {
                            Text("OSC Inbound Port (From Quest)")
                                .font(.system(size: 12, weight: .medium))
                            Spacer()
                            Text("\(client.config.portIn)")
                                .font(.system(size: 12, weight: .bold))
                                .monospacedDigit()
                                .foregroundColor(.secondary)
                        }
                        
                        Toggle("Auto-Discovery via OSCQuery (mDNS)", isOn: $client.config.oscqueryEnabled)
                            .toggleStyle(SwitchToggleStyle(tint: .emeraldAccent))
                    }
                }
                
                // Section 2: Leg Tweaks & Physics Grounding
                settingsSection(title: "LEG TWEAKS & GROUNDING") {
                    VStack(spacing: 12) {
                        Toggle("Floor Clip (Prevent feet sinking through floor)", isOn: Binding(
                            get: { client.legTweaks.floorClip },
                            set: {
                                client.legTweaks.floorClip = $0
                                client.setLegTweaks(client.legTweaks)
                            }
                        ))
                        .toggleStyle(SwitchToggleStyle(tint: .emeraldAccent))
                        
                        Toggle("Foot Plant Lock (Prevent foot drifting when planted)", isOn: Binding(
                            get: { client.legTweaks.footPlant },
                            set: {
                                client.legTweaks.footPlant = $0
                                client.setLegTweaks(client.legTweaks)
                            }
                        ))
                        .toggleStyle(SwitchToggleStyle(tint: .emeraldAccent))
                        
                        Toggle("Skating Correction", isOn: Binding(
                            get: { client.legTweaks.skatingCorrection },
                            set: {
                                client.legTweaks.skatingCorrection = $0
                                client.setLegTweaks(client.legTweaks)
                            }
                        ))
                        .toggleStyle(SwitchToggleStyle(tint: .emeraldAccent))
                    }
                }
                
                // Section 3: IMU Motion Filtering & Smoothing
                settingsSection(title: "MOTION FILTERING") {
                    HStack {
                        Text("Filtering Mode")
                            .font(.system(size: 12, weight: .medium))
                        Spacer()
                        Picker("", selection: Binding(
                            get: { client.filtering },
                            set: {
                                client.setFiltering($0)
                            }
                        )) {
                            ForEach(FilteringType.allCases) { filter in
                                Text(filter.rawValue).tag(filter)
                            }
                        }
                        .pickerStyle(.segmented)
                        .frame(width: 250)
                    }
                }
            }
            .padding(20)
        }
    }
    
    private func settingsSection<Content: View>(title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title)
                .font(.system(size: 11, weight: .bold))
                .foregroundColor(.secondary)
            
            VStack(alignment: .leading, spacing: 12) {
                content()
            }
            .padding(16)
            .background(.ultraThinMaterial)
            .cornerRadius(18)
            .overlay(RoundedRectangle(cornerRadius: 18).strokeBorder(Color.white.opacity(0.08), lineWidth: 1))
        }
    }
}
