# Architecture Reference

## Components

| Component | Path | Responsibility |
| --- | --- | --- |
| React renderer | `gui/src/` | UI, state, WebSocket hooks, tracking workflows |
| Electron host | `gui/electron/` | Window lifecycle, IPC, native integration, child processes |
| Server core | `server/core/` | Sensor ingestion, fusion, skeleton, RPC, OSC |
| Desktop server | `server/desktop/` | Desktop bootstrap and shadow JAR |
| SolarXR protocol | `solarxr-protocol/` | FlatBuffers schemas and generated TypeScript/Java libraries |
| OpenVR bridge | `bindings-provider/` | SteamVR/OpenVR integration |

`solarxr-protocol/` and `bindings-provider/openvr/` are Git submodules. Keep revision changes explicit.

## Ports

| Port | Transport | Owner |
| --- | --- | --- |
| `6969` | UDP | SlimeVR tracker packets |
| `21110` | TCP/WebSocket | GUI to SlimeVR server RPC/data feed |
| `9000` | UDP | VRChat/Quest OSC output |
| `5173` | TCP | Vite development server |
| `5037` | TCP | Local ADB server |
| `5555` | TCP | Quest legacy wireless ADB |

Confirm ownership with `lsof -nP` before changing or terminating a listener.

## Native Boundaries

- IPC channel names: `gui/electron/shared.ts`
- Preload surface/types: `gui/electron/preload/`
- Electron handlers/lifecycle: `gui/electron/main/index.ts`
- Quest ADB and scrcpy audio: `gui/electron/main/quest-audio.ts`
- Native channel test tones: `gui/electron/main/channel-test-tone.ts`

Keep renderer code behind the preload API; do not expose unrestricted Node or shell access to the renderer.
