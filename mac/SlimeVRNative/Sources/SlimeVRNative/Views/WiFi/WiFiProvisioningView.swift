import SwiftUI

public struct WiFiProvisioningView: View {
    @ObservedObject public var client: SlimeVRClient
    @State private var ssid: String = ""
    @State private var pass: String = ""
    
    public init(client: SlimeVRClient) {
        self.client = client
    }
    
    public var body: some View {
        HStack(alignment: .top, spacing: 20) {
            // Left: Credentials Form
            VStack(alignment: .leading, spacing: 14) {
                Text("PROVISION WI-FI OVER USB")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(.secondary)
                
                VStack(alignment: .leading, spacing: 10) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Wi-Fi Network Name (SSID)")
                            .font(.system(size: 11, weight: .medium))
                        TextField("e.g. MyHomeWiFi-5G", text: $ssid)
                            .textFieldStyle(.roundedBorder)
                    }
                    
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Network Password")
                            .font(.system(size: 11, weight: .medium))
                        SecureField("••••••••", text: $pass)
                            .textFieldStyle(.roundedBorder)
                    }
                    
                    Button(action: {
                        client.provisionWifi(ssid: ssid, pass: pass)
                    }) {
                        HStack {
                            Image(systemName: "paperplane.fill")
                            Text("Send to Plugged-In Tracker")
                                .font(.system(size: 12, weight: .bold))
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background(Color.emeraldAccent)
                        .foregroundColor(.white)
                        .cornerRadius(8)
                    }
                    .buttonStyle(.plain)
                    .disabled(ssid.isEmpty)
                }
                .padding(16)
                .background(.ultraThinMaterial)
                .cornerRadius(18)
                .overlay(RoundedRectangle(cornerRadius: 18).strokeBorder(Color.white.opacity(0.08), lineWidth: 1))
                
                Spacer()
            }
            .frame(width: 300)
            
            // Right: Live Serial Console Terminal
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    Text("LIVE SERIAL CONSOLE")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(.secondary)
                    
                    Spacer()
                    
                    Button("Clear") {
                        client.serialLogs.removeAll()
                    }
                    .font(.system(size: 10))
                }
                
                ScrollViewReader { proxy in
                    ScrollView(.vertical) {
                        LazyVStack(alignment: .leading, spacing: 3) {
                            if client.serialLogs.isEmpty {
                                Text("[Serial] Waiting for USB tracker connection...")
                                    .font(.system(size: 11, design: .monospaced))
                                    .foregroundColor(.secondary)
                            } else {
                                ForEach(client.serialLogs.indices, id: \.self) { idx in
                                    Text(client.serialLogs[idx])
                                        .font(.system(size: 11, design: .monospaced))
                                        .foregroundColor(.green.opacity(0.9))
                                }
                            }
                        }
                        .padding(10)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .background(Color.black.opacity(0.6))
                    .cornerRadius(12)
                    .overlay(RoundedRectangle(cornerRadius: 12).strokeBorder(Color.white.opacity(0.1), lineWidth: 1))
                }
            }
            .frame(maxWidth: .infinity)
        }
        .padding(20)
    }
}
