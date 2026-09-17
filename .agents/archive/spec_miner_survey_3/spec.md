# Frontend Specification & Safety Mining Report

**Agent**: `spec_miner_survey_3` (Role: Frontend Spec & Safety Miner)  
**Date**: 2026-09-02  
**Target Repository**: SlimeVR Server GUI (`gui/`) & Protocol (`solarxr-protocol/`)  
**Scope**: Dependencies, TypeScript, Build Pipeline, SolarXR Protocol Boundaries (R4), Test Capabilities & Quality Verification.

---

## 1. Executive Summary & Core Findings

This specification report documents the exact structure, package ecosystem, compiler configurations, build pipelines, testability, and backend/protocol safety boundaries of the SlimeVR macOS frontend application.

### Key Highlights
1. **Package Ecosystem**: Managed exclusively by `pnpm` (10.33.0) across a multi-package workspace (`gui`, `solarxr-protocol`). Node version: 22.17.0+ (active: v26.8.1).
2. **Build Architecture**: Uses `electron-vite` (v5.0.0) with Vite 5.4.8, producing three distinct bundles:
   - Electron Main (`gui/electron/main/index.ts` -> `out/main/index.js`)
   - Preload Script (`gui/electron/preload/index.ts` -> `out/preload/index.js` in CommonJS format)
   - Renderer App (`gui/index.html` + `gui/src/` -> `out/renderer/`)
3. **Build Status**:
   - `tsc --noEmit`: **PASS** (0 errors)
   - `electron-vite build` (`pnpm build`): **PASS** (Exit code 0, 41.43s)
   - `eslint`: **FAIL** (2 errors, 2 warnings — empty catch blocks in `presets.ts`, unused variables in `Home.tsx` and `PresetSelector.tsx`)
   - `prettier --check`: **FAIL** (12 files flagged for formatting)
4. **Backend Boundary Safety (R4)**:
   - All server communications occur strictly via WebSocket (`ws://localhost:21110`) using binary FlatBuffers (`MessageBundle` containing `RpcMessageHeader`, `DataFeedMessageHeader`, and `PubSubHeader`).
   - Zero modifications to `solarxr-protocol/schema/`, `server/`, or tracker firmware are permitted.
   - Desktop IPC is mediated strictly through `contextBridge` exposing `window.electronAPI` via 14 channels in `gui/electron/shared.ts`.
5. **Testing Landscape**:
   - Currently, there are **no automated test suites** (`vitest` or `jest` not installed, zero `*.test.tsx` files).
   - `setupTests.ts` is an orphan stub importing `@testing-library/jest-dom`.
   - Recommended E2E / headless testing track provided below.

---

## 2. Package Management & Dependencies Inventory

### Package Manager & Workspace Configuration
- **Package Manager**: `pnpm@10.33.0` (enforced via `"preinstall": "npx only-allow pnpm"` in root `package.json`).
- **Workspace Configuration (`pnpm-workspace.yaml`)**:
  ```yaml
  packages:
    - "solarxr-protocol"
    - "gui"
    - "!solarxr-protocol/lib/flatbuffers/**"
  onlyBuiltDependencies:
    - '@parcel/watcher'
    - '@sentry/cli'
    - '@swc/core'
    - electron
    - electron-winstaller
    - esbuild
    - register-scheme
    - unrs-resolver
  ```

### Dependencies & Frameworks Matrix
| Dependency Group | Package & Version | Role & Usage in GUI |
|---|---|---|
| **Core UI Framework** | `react@^18.3.1`<br>`react-dom@^18.3.1`<br>`react-router-dom@^6.26.2` | Client-side SPA rendering with HashRouter navigation |
| **Desktop Runtime** | `electron@^40.3.0`<br>`electron-vite@^5.0.0`<br>`electron-builder@^26.15.0` | macOS single-window desktop runtime & packaging |
| **Styling & Design** | `tailwindcss@^3.4.13`<br>`@tailwindcss/forms@^0.5.9`<br>`@tailwindcss/typography@^0.5.15`<br>`tailwind-gradient-mask-image@^1.2.0`<br>`sass@^1.79.4` | Liquid Glass design system, CSS variables, backdrop blur |
| **State Management** | `jotai@^2.12.2`<br>`@tanstack/react-query@^5.48.0`<br>`@react-hookz/deep-equal@^3.0.3` | Atom-based reactive state (`app-store.ts`) & async queries |
| **Protocol & Serialization** | `flatbuffers@22.10.26`<br>`solarxr-protocol@file:../solarxr-protocol` | Binary FlatBuffers transport for SolarXR WebSocket stream |
| **3D Engine & Skeleton** | `three@^0.163.0`<br>`@types/three@^0.163.0`<br>`@tweenjs/tween.js@^25.0.0` | Interactive 3D Skeleton Visualizer and bone preview |
| **Localization (i18n)** | `@fluent/bundle@^0.18.0`<br>`@fluent/react@^0.15.2`<br>`@formatjs/intl-localematcher@^0.2.32`<br>`intl-pluralrules@^2.0.1` | Mozilla Fluent localization engine (`/i18n/{locale}/translation.ftl`) |
| **Forms & Validation** | `react-hook-form@^7.63.0`<br>`@hookform/resolvers@^3.6.0`<br>`yup@^1.4.0`<br>`ajv@^8.17.1` | Schema-driven form validation (WiFi creds, tracker configs) |
| **Logging & Diagnostics** | `pino@^10.3.1`<br>`pino-pretty@^13.1.3`<br>`pino-roll@^4.0.0` | Desktop log rotating in main process (`out/main/logger.ts`) |
| **Observability** | `@sentry/react@10.29.0`<br>`@sentry/vite-plugin@^2.22.7` | Error monitoring & crash reporting |
| **Integrations** | `@xhayper/discord-rpc@^1.3.0`<br>`@ryuziii/discord-rpc@1.0.1-rc.1`<br>`discord-rich-presence@^0.0.8` | Discord Rich Presence status broadcasting |

---

## 3. TypeScript, Compiler & Build Pipelines

### `gui/tsconfig.json` Specification
- **Target**: `es2023`
- **Module**: `esnext` (with `moduleResolution: "node"`)
- **Strict Mode**: `true`
- **JSX Mode**: `react-jsx`
- **Path Aliases**:
  - `"@/*": ["./src/*"]`
- **Included Paths**: `src/`, `electron/**/*`
- **No Emit**: `true` (Type-checking only, bundler emits artifacts)

### Build Pipelines (`electron.vite.config.ts` & `vite.config.ts`)
1. **Main Process Build**:
   - Entry: `electron/main/index.ts`
   - Output: `out/main/index.js`
   - Externalized: `pino`, `pino-pretty`, `pino-roll`, `commander`, `open`
2. **Preload Script Build**:
   - Entry: `electron/preload/index.ts`
   - Output: `out/preload/index.js` (Strictly CommonJS format for Electron preload security)
3. **Renderer Process Build**:
   - Entry: `index.html` (resolves to `src/index.tsx`)
   - Output: `out/renderer/`
   - CommonJS interop enabled for `solarxr-protocol`
   - SCSS preprocessor: modern API
   - Custom Vite Plugins:
     - `@vitejs/plugin-react` (with Jotai Babel refresh)
     - `i18nHotReload()`: triggers HMR on `.ftl` translation changes
     - `visualizer()`: bundle size analysis report generator (`stats.html`)
     - `sentryVitePlugin`: automated sourcemap upload & release management

### macOS Electron Runtime & Packaging Configurations (`electron-builder.yml`)
- **App ID**: `dev.slimevr.SlimeVR`
- **Product Name**: `SlimeVR`
- **macOS Target**: `dmg`
- **macOS Artifact Pattern**: `SlimeVR-mac.${ext}`
- **Window Specs (`electron/main/index.ts`)**:
  - `minWidth`: 380, `minHeight`: 560 (Default: 960x680)
  - `titleBarStyle`: `hiddenInset`
  - `trafficLightPosition`: `{ x: 16, y: 14 }`
  - `vibrancy`: `under-window`
  - `visualEffectState`: `active`
  - `backgroundColor`: `#00000000` (Transparent for Liquid Glass materials)
  - `contextIsolation`: `true`, `nodeIntegration`: `false`
- **macOS Extra Bundled Files**:
  - `from: "../server/desktop/build/libs/slimevr.jar" to: "Resources/slimevr.jar"`

---

## 4. Backend & Protocol Safety Guardrails (R4 Compliance)

To guarantee **100% frontend-only safety** and prevent breakage with the Java/Kotlin server and firmware, the following architectural boundaries are strictly established:

```
+-------------------------------------------------------------------------------+
|                             ELECTRON RENDERER                                 |
|                                                                               |
|  React 18 UI <---> Jotai Stores <---> useWebsocketAPI <---> Flatbuffers Builder|
+---------------------------------------+---------------------------------------+
                                        | (Binary WebSocket: ws://localhost:21110)
                                        v
+-------------------------------------------------------------------------------+
|                       SOLARXR PROTOCOL / BACKEND SERVER                       |
|                                                                               |
|                       MessageBundle FlatBuffer Stream                         |
|  +------------------------+---------------------+--------------------------+  |
|  | dataFeedMsgs           | rpcMsgs             | pubSubMsgs               |  |
|  | (Sensors, Bones, IMU)  | (Commands, Resets)  | (Events, Topics)         |  |
|  +------------------------+---------------------+--------------------------+  |
|                                                                               |
|                   Java/Kotlin Server Core (Desktop / Daemon)                  |
|                   OSC Bridge (VRChat / Quest Port 9000)                       |
|                   Firmware OTA & Serial Manager                               |
+-------------------------------------------------------------------------------+
```

### Hard Safety Guardrails (DO NOT TOUCH):
1. **Schema Immutability**:
   - DO NOT edit or delete files in `solarxr-protocol/schema/` (`all.fbs`, `rpc.fbs`, `data_feed/*.fbs`, `pub_sub/*.fbs`, `settings/*.fbs`).
   - All FlatBuffers enums, tables, and unions must remain binary-compatible.
2. **Transport Layer Integrity**:
   - All WebSocket communications in `gui/src/hooks/websocket-api.ts` must use `MessageBundleT` wrapper packing with `flatbuffers.Builder(1)`.
   - Never alter default connection port (`21110`) or protocol framing byte buffer unpacking.
3. **IPC Bridge Contracts**:
   - `gui/electron/shared.ts` defines the 14 immutable IPC channels:
     - `server-status`, `open-url`, `os-stats`, `window-actions`, `log`, `storage`, `open-dialog`, `save-dialog`, `i18n-override`, `open-file`, `get-folder`, `gh-fetch`, `discord-presence`, `is-steam`.
   - Context isolation must remain enabled (`contextIsolation: true`, `nodeIntegration: false`).
4. **Backend Server Lifecycle**:
   - Electron main process handles spawning the Java server via `spawnServer()` (`findServerJar()` -> `findSystemJRE()` -> `spawn(javaBin, ['-Xmx128M', '-jar', serverJar, 'run'])`).
   - Frontend components must only read status events via `window.electronAPI.onServerStatus()`.

---

## 5. Existing Test Capabilities & E2E Testing Strategy

### Current Repository State
- **Unit / Integration Tests**: 0 test runner packages installed in `gui/package.json`. No `vitest`, `jest`, or `@testing-library/react` dependencies.
- **Test Stub**: `gui/src/setupTests.ts` is present with `@testing-library/jest-dom` import, but lacks underlying test runner configuration.
- **Headless Browser Execution**:
  - `pnpm --filter gui run start` (`vite --force`) can run the web UI in headless/mock mode in any Chromium/WebKit browser without launching Electron.
  - Development with Electron: `pnpm --filter gui run gui` (`electron-vite dev --watch`).

### Recommended Testing Track (For E2E & Unit Test Agents)
1. **Component & Hook Unit Testing**:
   - Install `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, and `jsdom`.
   - Mock WebSocket connection via `MockWebSocket` to emit synthetic `MessageBundle` binary payloads.
2. **Visual & Responsive Snapshot Testing**:
   - Test layout proportions under standard macOS window boundaries:
     - Minimum Window: `380px x 560px`
     - Default Utility: `960px x 680px`
     - Compact Mode: `800px x 600px`
     - Expanded Desktop: `1300px+`
3. **State & Atom Verification**:
   - Directly test Jotai atoms (`assignedTrackersAtom`, `connectedIMUTrackersAtom`, `feetAssignedTrackers`) using dummy `DataFeedUpdateT` structures.

---

## 6. Features Discovered & Probe Matrix

## Features Discovered
| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Layout | Responsive Mac Window | Adaptive 3-column/single-column grid with dynamic height/width bounds | Window dimensions (380x560 to 1600+) | Dynamic grid areas ('t', 'n', 'c', 'b', 's') | Falls back to default state (960x680) if display bounds invalid | `MainLayout.tsx`, `MainLayout.scss` |
| 2 | Styling | Liquid Glass Tokens | Semantic CSS variables for backdrop blur, borders, pills, and surface materials | CSS variable declarations in `:root` | Applied backdrop-filter & saturation classes | Fallback to solid background on `prefers-reduced-transparency` | `index.scss`, `tailwind.config.ts` |
| 3 | Diagnostics | Quest / OSC Diagnostics Pill | Subheader status indicator showing WebSocket status, tracker counts, and OSC port 9000 status | WebSocket connection state, atom stores | Interactive popup dropdown with diagnostic metrics | Displays red offline status pill when disconnected | `QuestDiagnosticsPill.tsx` |
| 4 | Configuration | Tracker Preset Selector | Subheader dropdown to quickly switch, duplicate, and delete hardware tracker presets | Preset ID / custom body parts array | Updates active preset in LocalStorage & atom state | Reverts to 'five-tracker' preset if ID missing | `PresetSelector.tsx`, `presets.ts` |
| 5 | Reset & Calibration | Drift & Mounting Reset Toolbar | Quick-access action buttons for Full Reset, Yaw Reset, Mounting Calibration (default/feet/fingers) | User click / timer countdown | Dispatches `RpcMessage.ResetRequest` / `RpcMessage.ChangeSettingsRequest` | Displays tooltips with error codes on timeout | `Toolbar.tsx`, `ResetButton.tsx`, `reset.ts` |
| 6 | 3D Visualization | Skeleton Visualizer Widget | Three.js WebGL visualizer rendering live bone orientations and body proportions | `bonesAtom` stream (`BoneT[]`) | Real-time 3D rendered avatar skeleton with OrbitControls | Disables render loop when toggled off via eye icon | `SkeletonVisualizerWidget.tsx` |
| 7 | Localization | Fluent i18n Hot-Reload | Mozilla Fluent bundle loader with locale auto-detection and Vite HMR | `.ftl` files in `public/i18n/{locale}/` | Localized UI strings via `<Typography id="..." />` | Falls back to English (`en`) bundle if key missing | `i18n/config.tsx`, `vite.config.ts` |
| 8 | Electron Desktop | Traffic Light & Window Controls | Mac-native titlebar styling with `hiddenInset` and 78px inset padding | Window drag & close events | System traffic light positioning `{x:16, y:14}` | Native window action IPC fallback | `electron/main/index.ts`, `TopBar.tsx` |

## Edge Cases
| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | Window Sizing | Window resized below minimum (`< 380x560`) | Window constrained by Electron `minWidth: 380, minHeight: 560`; CSS triggers mobile view grid layout (`@screen mobile`) |
| 2 | Backend Disconnection | Server closes WebSocket port 21110 | `useProvideWebsocketApi` displays warning, initiates exponential reconnect timer every 3000ms, Quest pill turns red |
| 3 | Preset Corruption | Invalid JSON in `localStorage.slimevr_user_presets` | Catch block triggers and safely loads `DEFAULT_PRESETS` (Minimal, 5-Tracker, Full Body, Sitting) |
| 4 | Accessibility | OS `prefers-reduced-motion` enabled | CSS resets all transitions/animations to `0.01ms` duration |
| 5 | Accessibility | OS `prefers-reduced-transparency` enabled | CSS disables `backdrop-filter` and replaces glass layers with solid `colors.background.60` |

---

## 7. Command Reference & Baseline Verification Log

### Exact Execution Commands

```bash
# 1. TypeScript Static Typecheck (Must pass with 0 errors)
pnpm --filter gui exec tsc --noEmit
# OR inside gui/ directory:
npx tsc --noEmit

# 2. ESLint Validation (With zero warnings policy)
npx eslint --max-warnings=0 "{electron,src}/**/*.{js,jsx,ts,tsx,json}"

# 3. Prettier Style Check
npx prettier --check "{electron,src}/**/*.{js,jsx,ts,tsx,css,scss,md,json}"

# 4. Production Build (Compiles Electron Main, Preload, and Web Renderer)
pnpm --filter gui run build
# OR inside gui/ directory:
npx electron-vite build --config electron.vite.config.ts

# 5. Standalone Web Dev Server (Headless UI mode)
pnpm --filter gui run start

# 6. Electron Desktop Dev Mode
pnpm --filter gui run gui
```

### Baseline Verification Observations (Recorded 2026-09-02)
- **`tsc --noEmit`**: **PASSED** (Exit Code: 0, Output: Clean).
- **`pnpm build` (`electron-vite build`)**: **PASSED** (Exit Code: 0, Built in 41.43s, 2225 modules transformed).
- **`eslint`**: **FAILED** (Exit Code: 1, 2 errors: `no-empty` in `presets.ts:62,68`, 2 warnings: `@typescript-eslint/no-unused-vars` in `Home.tsx:37`, `PresetSelector.tsx:2`).
- **`prettier --check`**: **FAILED** (Exit Code: 1, 12 files require `--write` formatting).

---

## 8. Actionable Guidance for Subsequent Implementation Tracks

1. **Lint Fix Track**:
   - Remove unused import `TrackerPreset` from `PresetSelector.tsx:2`.
   - Remove unused declaration `setSettingsOpen` from `Home.tsx:37`.
   - Add proper comment or handling in `presets.ts:62,68` catch blocks (e.g. `// Ignore storage quota errors`).
   - Run `pnpm run format` (`prettier --write`) across `gui/src/` to ensure 100% style compliance.
2. **Layout Track (R1 & R2)**:
   - Ensure the sidebar collapsing logic maintains `minWidth: 380px` without horizontal overflow.
   - Utilize existing Liquid Glass tokens (`--glass-bg`, `--glass-border`, `.glass-panel`, `.glass-pill`) from `index.scss`.
3. **Safety Verification Track (R4)**:
   - Verify that all newly created UI components communicate strictly via existing Jotai atoms (`@/store/app-store.ts`) or `useWebsocketAPI` hooks without introducing direct backend calls.
