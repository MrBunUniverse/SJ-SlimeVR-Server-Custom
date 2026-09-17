# Project: SlimeVR macOS Electron/React UI Redesign

> Planning record. Milestone labels below are historical; use current source, package metadata, and the test runner for live status.

## Architecture
- **Environment**: Electron 40 + React 18 + TypeScript 5 + Vite 5 + TailwindCSS / SCSS.
- **Window Architecture**: macOS Single-Window Utility (`hiddenInset` title bar, `under-window` vibrancy, min size 380x560, default 960x680).
- **State Flow**: Binary FlatBuffers `solarxr-protocol` via WebSocket (`ws://localhost:21110`) -> Jotai Reactive Atoms (`datafeedAtom`, `bonesAtom`, `assignedTrackersAtom`, `connectedIMUTrackersAtom`, `serverGuardsAtom`) -> React UI Components.
- **Design System**: Liquid Glass material system with dynamic theme tokens (`--glass-bg`, `--glass-border`, `--glass-pill-bg`, `--glass-blur: 20px`), SF Pro typography, and 16-24px macOS radiuses.
- **Safety Boundary (R4)**: 100% frontend modifications strictly inside `gui/`. Zero changes to Java server, firmware, or `solarxr-protocol/schema/`.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F1 | Liquid Glass Materials & Tokens | Refined backdrop blur, thin low-contrast borders, frosted glass panels, 16-24px macOS radiuses | M1 | ORIGINAL_REQUEST §R2, survey_1 |
| F2 | SF Pro Typography & Interactive Polish | Native SF Pro font stack, interactive hover/press states, micro-interactions, empty onboarding cues | M1 | ORIGINAL_REQUEST §R2, survey_1 |
| F3 | Minimal Single-Window Layout Grid | Balanced responsive layout without dark empty voids or cramped columns from 960x680 down to 380x560 | M2 | ORIGINAL_REQUEST §R1, survey_1 |
| F4 | Collapsible Right Sidebar & 3D WebGL Drawer | Horizontal collapse / floating overlay for 3D skeleton visualizer & checklist with WebGL pause lifecycle | M2 | ORIGINAL_REQUEST §R1, survey_1 |
| F5 | Variable Tracker Fleet (Card & Row Views) | Dynamic card grid (`TrackerCard`) with shake glow & high-density table view (`TrackersTable`) with Euler vectors | M3 | ORIGINAL_REQUEST §R3, survey_2 |
| F6 | Multi-Attribute Health Pills & Badges | High-readability status pills for battery, ping/RSSI, packet loss, temperature, and body mounting | M3 | ORIGINAL_REQUEST §R3, survey_2 |
| F7 | Header Quick Presets & Quest Diagnostics | Quick preset selector dropdown, active tracker count, and live Quest/OSC port 9000 diagnostics pill | M3 | ORIGINAL_REQUEST §R3, survey_2 |
| F8 | Guarded Calibration & Reset Shortcuts | Guarded Full Reset, Yaw Reset, and Mounting Reset shortcuts with visual countdown cues and server guards | M3 | ORIGINAL_REQUEST §R3, survey_2 |
| F9 | Full E2E Test Suite Pass (Tiers 1-4) | Automated requirement-driven test verification covering features, boundaries, combinations, and workloads | M4 | ORIGINAL_REQUEST §Acceptance, survey_3 |
| F10 | Adversarial Coverage Hardening (Tier 5) | White-box stress-testing, layout boundary tests, state stress-tests, zero console error verification | M4 | ORIGINAL_REQUEST §Acceptance, survey_3 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Liquid Glass Design System & Theme Polish | Refine glass tokens, SF Pro fonts, 16-24px radiuses, hover states, empty state polish, lint fixes | none | PLANNED |
| M2 | Balanced Layout Grid & Collapsible Sidebar | Reorganize MainLayout grid, collapsible right drawer, responsive 960x680 to 380x560 adaptation | M1 | PLANNED |
| M3 | Tracker Fleet & Quest/OSC Monitoring | Polish TrackerCard/Table, health pills, header presets/diagnostics, and toolbar resets | M1, M2 | PLANNED |
| M4 | E2E Testing Pass & Adversarial Hardening | Phase 1 (100% E2E tests pass Tiers 1-4) + Phase 2 (Adversarial hardening Tier 5) | M1, M2, M3 | PLANNED |

## Interface Contracts
### M1 (Design System) ↔ M2 (Layout Grid) & M3 (Tracker Fleet)
- CSS Variables / Tokens:
  - `--glass-bg`: `rgba(255, 255, 255, 0.06)` (dark) / `rgba(255, 255, 255, 0.65)` (light)
  - `--glass-border`: `rgba(255, 255, 255, 0.12)` (dark) / `rgba(0, 0, 0, 0.08)` (light)
  - `--glass-pill-bg`: `rgba(255, 255, 255, 0.08)` (dark) / `rgba(0, 0, 0, 0.05)` (light)
  - `--glass-blur`: `20px`
  - `--radius-mac`: `16px` to `24px`
- CSS Utility Classes: `.glass-panel`, `.glass-panel-strong`, `.glass-pill`, `.glass-interactive`

### M2 (Layout Grid) ↔ M3 (Tracker Fleet)
- Main Content Area: Flex / Grid container occupying `calc(100vw - var(--navbar-w) - var(--sidebar-w))` dynamically adjusting from 0px to 380px sidebar width.
- Right Sidebar State: Atom / Context state `sidebarCollapsed: boolean`, allowing full width expansion of `Home.tsx` content.

### Frontend ↔ Backend (R4 Guardrail Contract)
- WebSocket Binary Stream: `ws://localhost:21110` (MessageBundle FlatBuffers)
- State Store: Read-only Jotai atoms (`datafeedAtom`, `bonesAtom`, `assignedTrackersAtom`, `connectedIMUTrackersAtom`, `serverGuardsAtom`)
- Reset Action Hooks: `useReset()` with `ResetType` enum

## Code Layout
```
gui/
├── electron/
│   ├── main/          # Electron main process, window creation, vibrancy, IPC
│   ├── preload/       # IPC preload bridge
│   └── shared.ts      # IPC channel definitions
├── src/
│   ├── components/
│   │   ├── commons/   # Reusable UI primitives (Button, Modal, Typography, Icon)
│   │   ├── home/      # Home view, PresetSelector, QuestDiagnosticsPill
│   │   ├── tracker/   # TrackerCard, TrackersTable, TrackerBattery, TrackerWifi, TrackerStatus
│   │   ├── MainLayout.tsx / MainLayout.scss # Layout shell, responsive grid
│   │   ├── TopBar.tsx / TopBar.scss         # Title bar, window controls, status pills
│   │   ├── Navbar.tsx / Navbar.scss         # Left navigation bar
│   │   ├── Sidebar.tsx / Sidebar.scss       # Right collapsible sidebar & 3D visualizer
│   │   └── Toolbar.tsx / ResetButton.tsx    # Bottom action bar & guarded reset shortcuts
│   ├── hooks/         # Custom hooks (presets, reset, tracker, websocket-api)
│   ├── store/         # Jotai atoms (app-store.ts)
│   └── index.scss     # Global design tokens, Liquid Glass classes, fonts
```
