import SwiftUI

public struct StandaloneToggle: View {
    @Binding public var isStandalone: Bool
    public var onToggle: (Bool) -> Void
    
    public init(isStandalone: Binding<Bool>, onToggle: @escaping (Bool) -> Void = { _ in }) {
        self._isStandalone = isStandalone
        self.onToggle = onToggle
    }
    
    public var body: some View {
        HStack(spacing: 8) {
            Text("Standalone")
                .font(.system(size: 12, weight: .semibold))
                .foregroundColor(.secondary)
            
            Toggle("", isOn: $isStandalone)
                .labelsHidden()
                .toggleStyle(SwitchToggleStyle(tint: .emeraldAccent))
                .onChange(of: isStandalone) { _, newValue in
                    onToggle(newValue)
                }
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(
            RoundedRectangle(cornerRadius: 9, style: .continuous)
                .fill(Color.primary.opacity(0.04))
                .overlay(
                    RoundedRectangle(cornerRadius: 9, style: .continuous)
                        .strokeBorder(Color.white.opacity(0.08), lineWidth: 1)
                )
        )
    }
}

extension Color {
    public static let emeraldAccent = Color(red: 16/255, green: 185/255, blue: 129/255)
    public static let skyAccent = Color(red: 14/255, green: 165/255, blue: 233/255)
}
