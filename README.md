# SlimeVR Server & Desktop Client

> High-performance spatial tracking server daemon and desktop management interface engineered for macOS, featuring standalone Quest VRChat OSC integration, fault-isolated IMU pipelines, and an authentic Apple Human Interface Guidelines desktop client.

---

### System Telemetry & Status

| Attribute | Specification |
| :--- | :--- |
| **Target Platform** | macOS 12 Monterey or later (Universal: Apple Silicon & Intel x86_64) |
| **Core Server Engine** | Kotlin 1.9 / OpenJDK 17 LTS Daemon (UDP & SolarXR RPC) |
| **Desktop Client** | Electron 40 / React 18 / TypeScript / Vite / Tailwind CSS |
| **Communication Protocol** | SolarXR FlatBuffers via WebSocket (`ws://127.0.0.1:21110`) |
| **Tracking Pipeline** | IMU sensor fusion, biomechanical skeleton solver, OSC broadcast (`:9000`) |
| **Test Verification** | 114 automated checks across 4 feature tiers plus support suites (100% passing) |
| **Licensing** | Dual Licensed: MIT and Apache 2.0 |

---

## Executive Overview

SlimeVR Server macOS Edition is an optimized, precision-engineered fork of the SlimeVR full-body tracking ecosystem. Designed specifically for professional VR creators, streamers, and enthusiasts on macOS, the platform unifies an ultra-low-latency tracking daemon with a minimalist, fluid desktop interface.

The system is architected around two decoupled tiers:
1. **The Tracking Daemon (`server`)**: A multithreaded Kotlin service running headlessly or backgrounded. It receives high-frequency IMU packets over UDP (`6969`), solves forward and inverse kinematics through a constrained human skeletal model, and broadcasts synchronized tracker poses to SteamVR and Meta Quest Standalone headsets.
2. **The Desktop Client (`gui`)**: A lightweight, GPU-accelerated Electron interface designed according to Apple Human Interface Guidelines. It provides real-time sensor diagnostics, quick-access tracking presets, spatial floor elevation calibration, and hardware provisioning without unnecessary background CPU utilization.

---

## System Architecture

```
SJ SlimeVR Server/
├── Launch SlimeVR.command          # Unified one-click macOS launcher (builds & runs daemon + client)
├── Stop SlimeVR.command            # Graceful process supervisor shutdown
│
├── gui/                            # Desktop Client (Electron + React 18 + TypeScript)
│   ├── electron/                   # Native macOS window host, power assertions & menu bar tray
│   ├── src/
│   │   ├── components/             # Apple HIG interface components, HUD cards & diagnostics
│   │   ├── hooks/                  # Spatial calculations, presets, and WebSocket protocol hooks
│   │   ├── store/                  # Jotai atomic state management & tracker fleet models
│   │   └── utils/                  # Web Audio synthesizers & formatting utilities
│   └── tests/                      # 4-Tier test suite (Features, Boundaries, Combinations, Scenarios)
│
├── server/                         # Core Tracking Daemon (Kotlin / Java)
│   ├── core/                       # Biomechanical skeleton solver, UDP server & OSC streamer
│   └── desktop/                    # Desktop entry point, serial bridge & IPC pipes
│
├── solarxr-protocol/               # FlatBuffers protocol schemas & TypeScript codegen
├── bindings-provider/              # SteamVR OpenVR driver bridge
└── docs/                           # Documentation index, specifications, audits & licenses
```

### Where to Find Things

| Task | Location |
| :--- | :--- |
| Change the desktop interface | [`gui/src`](gui/src) |
| Change Electron/macOS integration | [`gui/electron`](gui/electron) |
| Change tracking or OSC behavior | [`server/core`](server/core) |
| Change FlatBuffers messages | [`solarxr-protocol`](solarxr-protocol) |
| Run or package the GUI | [`gui`](gui) |
| Read technical documentation | [`docs/README.md`](docs/README.md) |

The following local directories are generated or machine-specific and are not application source: `.backup/`, `.gradle/`, `.kotlin/`, `.pnpm-store/`, `.tools/`, `build/`, `graphify-out/`, `gui/out/`, and `node_modules/`. They are excluded by `.gitignore` and can normally be hidden in your editor.

---

## Key Technical Capabilities

### 1. Tracker Disconnect Isolation & Self-Healing
Standard tracking servers are susceptible to cascade failures when a single sensor disconnects or drains its battery. This system introduces:
* **Per-Tracker Socket Isolation**: Sensor loss is localized; active sensors maintain tracking continuity without frame jitter or state resetting.
* **Non-Destructive IMU Re-Scanning**: Probe silent Wi-Fi or USB trackers without resetting calibrated mounting angles or bone proportions.
* **Supervisor Re-Binding**: Automatically rebinds port `6969` if network topology shifts between Wi-Fi and Ethernet adapters.

### 2. Meta Quest Standalone VRChat OSC Integration
Engineered for zero-PC tethering with standalone Meta Quest headsets:
* **Auto-Discovery & Heartbeat Monitoring**: Probes Quest local network interfaces and confirms bidirectional UDP handshake on port `9000`.
* **Pro Elevation Scrubber**: Calibrated millimeter-accurate floor offset adjustment (`[-1cm]` / `[+1cm]`) with a magnetic `0cm` floor detent, enabling in-headset flight or height leveling without re-running SteamVR room setup.
* **Dynamic OSC Rate Throttling**: Adjustable broadcast frequency (`30Hz`, `50Hz`, `60Hz`, `90Hz`) to balance network throughput and tracking fidelity.

### 3. Apple Human Interface Guidelines & Desktop Polish
The desktop frontend is crafted to feel indistinguishable from a first-party macOS application:
* **4-Tier Optical Vibrancy**: Utilizes macOS system vibrancy tokens (`--material-primary`, `--material-secondary`) with hardware-accelerated backdrop blur filters.
* **Concentric Squircle Geometry**: Strict adherence to concentric corner radii ($R_{\text{outer}} = R_{\text{inner}} + \text{Padding}$), eliminating visual dissonance.
* **Tabular Figures (`tnum`)**: OpenType tabular numerals across all telemetry cards to prevent horizontal jitter during high-rate IMU rotations.
* **Web Audio Calibration Cues**: Synthesizes soft sine tones for countdown resets and harmonic major arpeggios on calibration completion, audible inside the VR headset.

### 4. GPU & Power Optimization
* **On-Demand WebGL Preview**: 3D skeleton visualizer monitors scene dirty frames, pausing rendering cycles when tracking data is static.
* **Retina Density Capping**: Automatically caps viewport canvas resolution at `1.5x` device pixel ratio, saving battery life and thermals on high-DPI displays.
* **Prevent App Suspension**: Configures native macOS `powerSaveBlocker` assertions while tracking sessions are active.

---

## Getting Started

### Prerequisites
* **Operating System**: macOS 12.0 (Monterey) or newer
* **Java Runtime**: OpenJDK 17 or later (`brew install openjdk@17`)
* **Node.js Environment**: Node.js 22.17+ and `pnpm` 10.33+ (`brew install pnpm`)

### One-Click Launch
Double-click either script in Finder or execute via Terminal:

```bash
# Launch both tracking server daemon and desktop client
./"Launch SlimeVR.command"

# Terminate all running server and client processes cleanly
./"Stop SlimeVR.command"
```

---

## Development & Build Toolchain

The monorepo leverages Gradle for backend services and `pnpm` workspaces for frontend packages.

```bash
# 1. Compile the server daemon JAR
./gradlew :server:desktop:shadowJar

# 2. Build the Electron client production bundle
cd gui && pnpm run build

# 3. Package the installable Electron app
cd gui && pnpm run package:build

# 4. Launch the Electron client in development mode (with Hot Module Replacement)
cd gui && pnpm run gui

# 5. Verify code quality and formatting
cd gui && pnpm run lint
```

---

## Quality Engineering & Verification

The client features a comprehensive four-tier automated test suite executed directly on Node.js:

```bash
cd gui && pnpm test
```

| Tier | Focus Area | Scope |
| :--- | :--- | :--- |
| **Tier 1: Feature Coverage** | Design tokens, SF Pro typography, layout grid, health badges, preset switching | 57 Tests |
| **Tier 2: Boundary Cases** | Viewport bounds (380x560 to 4K), fleet scale (0 to 32 trackers), hardware faults, gimbal lock | 25 Tests |
| **Tier 3: Combinations** | Multi-tracker resets during network degradation, theme switching under active IMU streams | 10 Tests |
| **Tier 4: Scenarios** | VR cold starts, live calibration workflows, Quest OSC streaming sessions, tracker hot-plugging | 8 Tests |
| **Adaptive BPM** | Source-contract checks for adaptive calibration behavior | 6 Tests |
| **Quest Capture** | Quest capture and diagnostics behavior | 5 Tests |
| **Runtime regressions** | Data-feed reuse and binary WebSocket decoding | 3 Tests |

*Current coverage: 114 tests across 26 suites, verified with zero regressions.*

---

## License & Trademarks

This project is licensed under the dual terms of the **MIT License** and the **Apache License (Version 2.0)**. You may select either license at your option.

* [MIT License Documentation](docs/licenses/LICENSE-MIT)
* [Apache 2.0 License Documentation](docs/licenses/LICENSE-APACHE)
* [Contributing Standards](docs/CONTRIBUTING.md)
* [Trademark Information](docs/TRADEMARK.md)

*SlimeVR and the SlimeVR logo are trademarks of the SlimeVR project. All other company, product, and service names are trademarks or registered trademarks of their respective holders.*
