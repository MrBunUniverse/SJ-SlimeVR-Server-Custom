import SwiftUI

public struct TrackerAssignmentView: View {
    @ObservedObject public var client: SlimeVRClient
    @State private var selectedPart: BodyPart? = nil
    
    public init(client: SlimeVRClient) {
        self.client = client
    }
    
    public var body: some View {
        HStack(spacing: 20) {
            // Left: Visual Human Body Slot Map
            VStack(spacing: 12) {
                Text("HUMAN BODY TARGETS")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(.secondary)
                
                VStack(spacing: 8) {
                    // Head
                    bodySlot(for: .head)
                    
                    // Chest
                    bodySlot(for: .chest)
                    
                    // Arms Row
                    HStack(spacing: 12) {
                        bodySlot(for: .leftUpperArm)
                        bodySlot(for: .waist)
                        bodySlot(for: .rightUpperArm)
                    }
                    
                    // Thighs Row
                    HStack(spacing: 24) {
                        bodySlot(for: .leftThigh)
                        bodySlot(for: .rightThigh)
                    }
                    
                    // Feet Row
                    HStack(spacing: 24) {
                        bodySlot(for: .leftFoot)
                        bodySlot(for: .rightFoot)
                    }
                }
                .padding(16)
                .background(.ultraThinMaterial)
                .cornerRadius(20)
                .overlay(RoundedRectangle(cornerRadius: 20).strokeBorder(Color.white.opacity(0.08), lineWidth: 1))
            }
            .frame(width: 320)
            
            // Right: Tracker Selection / Unassigned List
            VStack(alignment: .leading, spacing: 14) {
                Text("TRACKER POOL")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(.secondary)
                
                ScrollView(.vertical, showsIndicators: false) {
                    VStack(spacing: 10) {
                        ForEach(client.trackers) { tracker in
                            HStack {
                                Image(systemName: tracker.bodyPart.sfSymbol)
                                    .font(.system(size: 14, weight: .bold))
                                    .foregroundColor(.emeraldAccent)
                                
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(tracker.name)
                                        .font(.system(size: 13, weight: .semibold))
                                    Text("Currently: \(tracker.bodyPart.rawValue)")
                                        .font(.system(size: 11))
                                        .foregroundColor(.secondary)
                                }
                                
                                Spacer()
                                
                                Menu {
                                    ForEach(BodyPart.allCases) { part in
                                        Button(part.rawValue) {
                                            client.assignTracker(id: tracker.id, to: part)
                                        }
                                    }
                                } label: {
                                    Text("Reassign")
                                        .font(.system(size: 11, weight: .medium))
                                }
                            }
                            .padding(10)
                            .background(Color.white.opacity(0.04))
                            .cornerRadius(10)
                        }
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .topLeading)
        }
        .padding(20)
    }
    
    private func bodySlot(for part: BodyPart) -> some View {
        let assigned = client.trackers.first(where: { $0.bodyPart == part })
        
        return Button(action: {
            selectedPart = part
        }) {
            HStack(spacing: 6) {
                Image(systemName: part.sfSymbol)
                    .font(.system(size: 11))
                Text(part.rawValue)
                    .font(.system(size: 11.5, weight: .semibold))
                
                if assigned != nil {
                    Circle().fill(Color.emeraldAccent).frame(width: 6, height: 6)
                }
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(assigned != nil ? Color.emeraldAccent.opacity(0.15) : Color.white.opacity(0.06))
            .foregroundColor(assigned != nil ? .primary : .secondary)
            .cornerRadius(8)
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .strokeBorder(assigned != nil ? Color.emeraldAccent.opacity(0.4) : Color.white.opacity(0.1), lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }
}
