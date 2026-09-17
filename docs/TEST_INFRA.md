# SlimeVR GUI Redesign — Test Infrastructure & Harness Documentation

## 1. Test Architecture Overview

The SlimeVR macOS Electron/React UI redesign automated test harness uses Node.js 22 native test runner (`node:test`, `node:assert/strict`) with native TypeScript type stripping (`--experimental-strip-types`). It provides fast, zero-dependency, deterministic checks across four feature tiers and three support suites. These are source-contract and simulation tests; they do not replace browser, Electron-package, or connected-headset verification.

### Test Directory Layout
```
gui/tests/
├── helpers/
│   └── test-utils.ts            # State machines, layout calculators, protocol simulators
├── tier1-features.test.ts       # Tier 1: Feature Coverage (F1 - F8)
├── tier2-boundaries.test.ts     # Tier 2: Boundary & Corner Cases (B1 - B5)
├── tier3-combinations.test.ts   # Tier 3: Cross-Feature Combinations (C1 - C5)
├── tier4-scenarios.test.ts      # Tier 4: Real-World Application Scenarios (S1 - S4)
├── adaptive-bpm.test.ts         # Support: adaptive calibration contracts
├── quest-capture.test.ts         # Support: Quest capture and diagnostics
├── runtime-efficiency.test.ts    # Support: runtime and data-feed regressions
└── e2e-runner.ts                # Master CLI test runner & reporter
```

## 2. Test Tiers Specification

### Tier 1: Feature Coverage (57 Tests)
- **F1: Liquid Glass Tokens & Material Polish (12 Tests)**: Validates `--glass-bg` (0.72 alpha dark vibrancy), `--glass-blur: 20px`, frosted border tokens, `.glass-panel` and `.glass-panel-strong` backdrop-filter styles, `.glass-pill`, `.glass-interactive` micro-state transitions, and macOS 16px (`rounded-2xl`) / 24px (`rounded-3xl`) corner radiuses.
- **F2: SF Pro Typography & Interactive Polish (5 Tests)**: Validates system-native SF Pro font stack hierarchy, global `tabular-nums` for numeric telemetry, subpixel antialiasing (`-webkit-font-smoothing`, `-moz-osx-font-smoothing`), `-0.01em` tracking-tight letter spacing, and active scale feedback (`active:scale-[0.97]` / `transform: scale(0.975)`).
- **F3: Minimal Single-Window Layout Grid (5 Tests)**: Validates grid area mapping (`t`, `n`, `c`, `s`, `b`), standard 960x680 proportions without empty voids, compact 380x560 mobile layout adaptation, ultra-wide 1920x1080 display scaling, and dynamic topbar height shifts (38px desktop vs 44px mobile).
- **F4: Collapsible Right Sidebar & 3D WebGL Drawer (5 Tests)**: Validates checklist drawer height (90px collapsed vs `calc(100% - 16px)` open), 3D visualizer preview drawer height (`calc(100% - 114px)` open vs `0%` closed), WebGL render pause lifecycle (`disabledRender = true`), tracking checklist completion trigger, and estimated height formula `(userHeight * 100) / 0.936`.
- **F5: Variable Tracker Fleet (Card & Row Views) (5 Tests)**: Validates `TrackerCard` grid rendering (`homeLayout === 'default'`), high-density `TrackersTable` rendering (`homeLayout === 'table'`), Card/Row layout toggling, shake highlight velocity glow calculation `Math.floor(velocity * 8)`, and Euler vector precision formatting.
- **F6: Multi-Attribute Health Pills & Badges (5 Tests)**: Validates battery percentage, voltage (`X.XX V`), runtime (`Xh Ym`), critical low battery thresholds (< 10%), placeholder fallbacks, warning badges (`border-status-warning`), and disconnected component disabling.
- **F7: Header Quick Presets & Quest Diagnostics (12 Tests)**: Validates active preset display with sparkle indicator `✦`, preset switching via `setActivePresetId`, Manage Presets modal, Quest OSC diagnostics status pill colors (`bg-status-success`, `bg-status-warning`, `bg-status-critical`), and Quest/VRChat OSC Port 9000 readiness summary.
- **F8: Guarded Calibration & Reset Shortcuts (8 Tests)**: Validates reset types (`Yaw`, `Full`, `Mounting` default/feet/fingers), Full Reset 3s countdown timer with linear progress, immediate Yaw reset (duration = 0), server guard lock error tooltip state, and finished success green border styling.

### Tier 2: Boundary & Corner Cases (25 Tests)
- **B1: Window Dimension Boundaries (5 Tests)**: Minimum size (380x560), default size (960x680), intermediate size (600x400), 4K ultra-wide (3840x2160), and height-constrained aspect ratio (960x300).
- **B2: Tracker Fleet Scale Boundaries (5 Tests)**: 0 trackers empty state onboarding, 1 tracker minimal setup, 16 full-body trackers, 32 maximum fleet trackers in high-density table view, and unassigned trackers partition.
- **B3: Network & Hardware Faults (5 Tests)**: 100% packet loss timeout transition, extreme high ping latency (> 500ms), critical low battery (< 5%), abrupt WebSocket disconnect, and rapid WebSocket reconnection without state duplication.
- **B4: Extreme Mathematical Orientations (5 Tests)**: Gimbal lock singularities (Pitch = +/-90.0°), yaw boundary wraps (+/-180.0°), identity zero rotation and `-0.0` normalization, extreme IMU velocity clamp (velocity > 50), and floating point precision stability.
- **B5: Theme Switching & Material Integrity (5 Tests)**: Dark theme tokens, light theme tokens, text contrast preservation (>= 4.5:1), rapid theme toggle loop (10 cycles), and theme persistence in app config.

### Tier 3: Cross-Feature Combinations (10 Tests)
- **C1: High-Density Table + Collapsible Sidebar Drawer Toggle (2 Tests)**: Dynamic content width recalculation and table column adaptation during sidebar drawer collapse/expansion with 16 trackers.
- **C2: Theme Switch + Liquid Glass Tracker Cards + Shake Glow (2 Tests)**: Dynamic velocity glow recalculation across theme transitions with consistent opacity tokens.
- **C3: Multi-Tracker Reset Countdown + Active OSC Diagnostics Pill Update (2 Tests)**: Concurrent countdown execution alongside live diagnostics pill updates and server disconnect handling.
- **C4: Preset Switching + Unassigned Tracker Detection + Table View (2 Tests)**: Dynamic tracker filtering between Full Body and Upper Body presets while preserving unassigned hardware devices.
- **C5: Min Window Size (380x560) + 32 Trackers + Collapsed Checklist + Fast Reset (2 Tests)**: Mobile layout rendering 32 trackers with auto-collapsed checklist and instant Yaw reset trigger.

### Tier 4: Real-World Application Scenarios (8 Tests)
- **S1: Complete VR Cold-Start Session (2 Tests)**: Cold-start WebSocket connection, 8 IMU discovery, health telemetry validation, checklist expansion, and auto-collapse upon completion.
- **S2: Live Calibration & Body Proportioning Workflow (2 Tests)**: User height ingestion, formatted visualizer estimation, sequential Yaw reset followed by guarded 3s Ski Mounting reset.
- **S3: Standalone Quest OSC Streaming & Active Monitoring Workflow (2 Tests)**: Continuous OSC streaming, battery discharge, packet loss handling, and quick preset change from Full Body (8) to Seated (5).
- **S4: Dynamic Tracker Hot-Plug & Reconfiguration Workflow (2 Tests)**: Ingesting new SlimeVR hardware, unassigned tracker notification, arm assignment, shake highlight trigger, and diagnostics pill count update.

### Support suites (14 Tests)
- **Adaptive BPM (6 Tests)**: Source-contract checks for adaptive calibration behavior.
- **Quest Capture (5 Tests)**: Quest capture and diagnostics behavior.
- **Runtime efficiency (3 Tests)**: Data-feed reuse and binary WebSocket decoding.

## 3. How to Execute Tests

### Using pnpm
```bash
cd gui
pnpm test
```

### Using Node directly
```bash
cd gui
node --experimental-strip-types tests/e2e-runner.ts
```

### Running Individual Tiers
```bash
cd gui
node --test --experimental-strip-types tests/tier1-features.test.ts
node --test --experimental-strip-types tests/tier2-boundaries.test.ts
node --test --experimental-strip-types tests/tier3-combinations.test.ts
node --test --experimental-strip-types tests/tier4-scenarios.test.ts
```

## 4. Test Results Summary
- **Total Test Suites**: 26
- **Total Tests**: 114 (100 feature-tier checks plus 14 support checks)
- **Passed**: 114 (100%)
- **Failed**: 0 (0%)
- **Execution Time**: ~1s on the development machine
