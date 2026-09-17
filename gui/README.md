# SlimeVR Desktop Client Core (`gui`)

> High-density, Apple HIG-compliant desktop frontend interface built with React 18, TypeScript, Tailwind CSS, and Electron.

---

### Package Metadata

| Property                 | Value                                                               |
| :----------------------- | :------------------------------------------------------------------ |
| **Package Name**         | `slimevr` (Desktop GUI)                                             |
| **Build Framework**      | Electron Vite 2 / Vite 5 / Tailwind CSS 3                           |
| **State Layer**          | Jotai Atomic Store with selective re-renders                        |
| **Protocol Engine**      | SolarXR Protocol (FlatBuffers over WebSocket)                       |
| **Formatting & Quality** | TypeScript 5 (`tsc --noEmit`), ESLint (0 warnings policy), Prettier |
| **Test Runner**          | Native Node.js Test Runner with experimental strip-types            |

---

## Directory Organization

```
gui/
├── electron/                         # Electron main process & native bridges
│   ├── main/                         # Window manager, power assertions, Discord RPC
│   ├── preload/                      # Context isolation security bridges
│   └── resources/                    # App icons, native binaries & metadata
│
├── src/                              # Renderer UI source tree
│   ├── components/                   # React components
│   │   ├── commons/                  # Atomic controls (Button, Input, Dropdown, Modals)
│   │   ├── home/                     # Dashboard, Quest telemetry HUD, preset selector
│   │   ├── onboarding/               # Setup wizard, tracker assignment, mounting steps
│   │   ├── tracker/                  # Sensor telemetry cards, part indicators, table views
│   │   └── widgets/                  # 3D skeleton & IMU visualizer viewports
│   ├── hooks/                        # Custom React hooks (operating-mode, presets, reset)
│   ├── store/                        # Jotai atoms (app-store, demo-trackers)
│   ├── utils/                        # Audio feedback synthesizer, telemetry formatters
│   ├── index.scss                    # Design tokens, optical glass variables & animations
│   └── index.tsx                     # React root bootstrap & provider bindings
│
└── tests/                            # Automated source-contract and simulation suite
    ├── helpers/                      # Mathematical test utilities & mock state helpers
    ├── tier1-features.test.ts        # Design token compliance, typography & layout grid
    ├── tier2-boundaries.test.ts      # Viewport stress, scale limits & hardware faults
    ├── tier3-combinations.test.ts    # Cross-feature interactions & concurrent resets
    ├── tier4-scenarios.test.ts       # Real-world VR tracking workflows & state transitions
    ├── adaptive-bpm.test.ts          # Adaptive calibration contracts
    ├── quest-capture.test.ts         # Quest capture and diagnostics
    ├── runtime-efficiency.test.ts    # Runtime and data-feed regressions
    └── e2e-runner.ts                 # Test suite orchestrator
```

---

## Core Engineering Systems

### 1. Atomic State Architecture (`src/store/`)

The application utilizes **Jotai** atoms to ensure high performance during 100Hz+ sensor updates:

- `devicesAtom`: Raw device records received from the SolarXR WebSocket stream.
- `flatTrackersAtom`: Normalizes multi-tracker devices into discrete tracker entities. Supports instant fallback to `DEMO_TRACKERS_SET` when demo mode is active.
- `assignedTrackersAtom` / `unassignedTrackersAtom`: Selectors filtering active hardware nodes based on user body assignments.
- `showSidebarAtom`: Controls responsive visibility of the 3D skeleton visualization drawer.

### 2. Design Tokens & Apple HIG Styling (`src/index.scss`)

- **Liquid Glass Tokens**: `--glass-bg: rgba(34, 35, 40, 0.72);`, `--glass-blur: 20px;`, `--glass-border: rgba(255, 255, 255, 0.10);`.
- **Subpixel Anti-Aliasing**: Forces `-webkit-font-smoothing: antialiased` and `-moz-osx-font-smoothing: grayscale`.
- **Tabular Figures**: `font-variant-numeric: tabular-nums` globally enforced to eliminate layout shifts during numerical updates.
- **Haptic-like Micro-Interactions**: Active scale transforms (`scale(0.975)` and `scale(0.98)`) calibrated to 140ms ease curves.

### 3. Acoustic Feedback System (`src/utils/audio-feedback.ts`)

Synthesizes real-time Web Audio tones for headset users:

- `playCountdownBeep(frequency)`: Emits sine-wave calibration pings at 880Hz and 1046Hz.
- `playResetSuccessChime()`: Triggers an arpeggiated tri-tone chord on completion.
- `playStepClick(up)`: Subtly clicks when adjusting the millimeter elevation scrubber.

---

## Scripts & Development Commands

```bash
# Start development server with live HMR
pnpm run gui

# Compile production bundles to out/
pnpm run build

# Run full static analysis, typecheck, and formatting checks
pnpm run lint

# Automatically format all code to Prettier standards
pnpm run format

# Run full 4-tier automated test suite
pnpm test
```
