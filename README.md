# SJ SlimeVR Server (macOS Edition)

A high-performance, native macOS SlimeVR Server and GUI fork engineered for **Quest Standalone VRChat OSC** and **SteamVR Full Body Tracking**.

---

## ⚡ Quick Start

Double-click to run on macOS:

* **Launch Application**: [`./Launch SlimeVR.command`](./Launch%20SlimeVR.command)
* **Stop Application**: [`./Stop SlimeVR.command`](./Stop%20SlimeVR.command)

---

## 📁 Project Architecture

```
SJ SlimeVR Sever/
├── Launch SlimeVR.command    # One-click macOS launcher (builds & runs)
├── Stop SlimeVR.command      # Clean process shutdown helper
│
├── gui/                      # Electron + React + Tailwind Frontend (macOS HIG)
│   ├── src/components/       # TopBar, Home, QuestDiagnosticsCard, TrackerCard
│   ├── src/hooks/            # operating-mode.ts, websocket-api.ts
│   └── electron/             # Native macOS window & vibrancy host
│
├── server/                   # Kotlin / Java Server Daemon
│   ├── core/                 # Tracking engine, HumanSkeleton, VRCOSCHandler, UDP server
│   └── desktop/              # Desktop entry point, serial, named pipes
│
├── solarxr-protocol/         # SolarXR FlatBuffers schema & TypeScript definitions
├── bindings-provider/        # SteamVR OpenVR driver bridge
└── docs/                     # Project documentation, guides & licenses
    ├── PROJECT.md            # Architecture specifications
    ├── TEST_INFRA.md         # End-to-end test runner documentation
    ├── CONTRIBUTING.md       # Contribution guidelines
    └── licenses/             # Dual MIT / Apache-2.0 legal licenses
```

---

## ✨ Key Features & Enhancements

1. **Tracker Disconnect Isolation & Self-Healing**:
   * Per-tracker socket isolation prevents single battery deaths from cascading to other healthy trackers.
   * Background supervisor loop auto-rebinds UDP 6969 if network drops.
   * Safe in-app **Scan for Trackers** button probes for silent IMUs non-destructively without wiping calibrations.
2. **Quest Standalone VRChat OSC & Floor Flight**:
   * Native OSC & OSCQuery auto-discovery with active target IP pill.
   * **Pro Elevation Scrubber**: Tactile `[-1cm]` / `[+1cm]` micro-steppers with centered magnetic `0cm` floor snap detent to fly or level in-game.
3. **macOS Sequoia Design Standards**:
   * 4-Tier optical glass vibrancy (`--material-primary`, `--material-secondary`).
   * 52pt Unified Toolbar with exact 82px window traffic light clearance.
   * Concentric squircle curvature ($R_{\text{outer}} = R_{\text{inner}} + \text{Padding}$).
   * SF Pro typography with OpenType tabular figures (`tnum`) for jitter-free telemetry.
   * 500ms tooltip dwell delay and CoreAnimation spring dynamics.

---

## 🛠️ Build Commands

```bash
# Build Backend Server
./gradlew :server:desktop:build

# Build Frontend GUI
cd gui && pnpm run build

# Run Development GUI with Live Reload
cd gui && pnpm run gui
```

---

## 📄 License & Legal

Distributed under dual **MIT** and **Apache 2.0** licenses.
* [MIT License](docs/licenses/LICENSE-MIT)
* [Apache 2.0 License](docs/licenses/LICENSE-APACHE)
* [Trademark Information](docs/TRADEMARK.md)
* [Contributing Guidelines](docs/CONTRIBUTING.md)
