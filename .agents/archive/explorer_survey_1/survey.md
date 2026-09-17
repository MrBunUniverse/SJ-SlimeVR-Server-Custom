# Comprehensive Survey: UI/UX Architecture, Layout Grid, Styling System, and Components

**Investigation Agent**: `explorer_survey_1` (UI/UX Layout Explorer)  
**Date**: 2026-09-02  
**Target Directory**: `gui/` (React 18 + Electron + Tailwind CSS 3.4 + SCSS + Jotai + Three.js)  
**Integrity Mode**: Read-Only Survey  

---

## 1. Executive Summary

The SlimeVR Desktop GUI is an Electron + React 18 single-page application built with Vite, Tailwind CSS 3.4, SCSS modules, and Three.js (for 3D skeleton and IMU orientation rendering). It interfaces with the SlimeVR Java backend via WebSocket IPC and SolarXR flatbuffers RPC protocol.

This survey provides an exhaustive architectural and visual layout analysis of the GUI, mapping entry points, routing hierarchies, grid allocations, responsive breakpoint behavior, styling and theme token pipelines, liquid glass materials, sidebar mechanisms, and component states.

---

## 2. Directory Structure & Entry Architecture

### 2.1 File Tree Map (`gui/`)
```
gui/
├── electron/
│   ├── main/
│   │   ├── index.ts           # BrowserWindow lifecycle, macOS titleBarStyle, window state persistence
│   │   ├── cli.ts             # CLI options (e.g. steam mode)
│   │   ├── logger.ts          # Pino logger
│   │   ├── paths.ts           # Data / logs / config path resolution
│   │   ├── presence.ts        # Discord RPC presence
│   │   ├── store.ts           # Electron persistent storage
│   │   └── utils.ts           # Platform helpers & IPC handlers
│   ├── preload/
│   │   ├── index.ts           # Context bridge exposing electron API to renderer
│   │   └── interface.d.ts     # Window.electron IPC type definitions
│   └── shared.ts              # IPC channel constants
├── src/
│   ├── App.tsx                # Main router, global context providers, server error/stdout listeners
│   ├── AppLayout.tsx          # Dynamic HTML dataset attributes (theme, font, size), onboarding guard
│   ├── index.tsx              # React DOM 18 root renderer
│   ├── index.scss             # Global CSS vars, Liquid Glass utility classes, theme variables, font-face
│   ├── tailwind.config.ts     # Tailwind theme extensions, custom color scales, typography utilities
│   ├── components/
│   │   ├── TopBar.tsx         # Drag region, macOS traffic-light margin, version badge, window actions
│   │   ├── Navbar.tsx         # Left sidebar navigation (84px desktop / bottom bar mobile)
│   │   ├── Toolbar.tsx        # Top action strip (96px) with drift & mounting calibration buttons
│   │   ├── Sidebar.tsx        # Right side panel hosting TrackingChecklist & 3D Skeleton Visualizer
│   │   ├── MainLayout.tsx     # 2D/3D CSS Grid layout wrapper (areas: t, n, b, c, s)
│   │   ├── MainLayout.scss    # Breakpoint-specific grid template formulas & width assignments
│   │   ├── commons/           # Atomic UI elements (Button, Input, Dropdown, Modal, BaseModal, Tooltip...)
│   │   ├── home/              # Dashboard root, PresetSelector, QuestDiagnosticsPill, ResetButtons
│   │   ├── tracker/           # TrackerCard, TrackersTable, TrackerSettings, Battery/Wifi status pills
│   │   ├── tracking-checklist/# Checklist steps, warning badges, step action triggers
│   │   ├── widgets/           # Three.js SkeletonVisualizerWidget, IMUVisualizerWidget, OverlayWidget
│   │   ├── settings/          # SettingsLayout, SettingsSidebar, sub-pages (Trackers, OSC, Serial...)
│   │   └── onboarding/        # Wizard layout, mounting/proportions step pages, auto/manual calibration
│   ├── hooks/                 # Business logic hooks (websocket-api, config, tracker, presets, reset, breakpoint)
│   └── store/                 # Jotai state atoms (assignedTrackersAtom, connectedIMUTrackersAtom, bonesAtom)
├── vite.config.ts             # Vite build pipeline, alias '@', Sentry, i18n hot reload
└── electron.vite.config.ts    # Dual build orchestration (Electron Main + Preload + Renderer)
```

### 2.2 Entry Point & Routing Flow
1. **Renderer Bootstrapping (`gui/src/index.tsx`)**:
   Renders `<App />` within the `#root` element.
2. **Provider Hierarchy (`gui/src/App.tsx`)**:
   ```tsx
   <ElectronContextC.Provider>
     <AppLocalizationProvider>
       <Router>
         <ConfigContextProvider>
           <WebSocketApiContext.Provider>
             <AppContextProvider>
               <OnboardingContextProvider>
                 <TrackingChecklistProvider>
                   <VersionContext.Provider>
                     <Preload />
                     {!isConnected ? <ConnectionLost /> : <Layout />}
   ```
3. **Route Map**:
   - `/` → `MainLayout (full)` → `Home` (Dashboard + Tracker Fleet)
   - `/vr-mode` → `MainLayout (full)` → `VRModePage` (Fullscreen 3D skeleton view)
   - `/checklist` → `MainLayout` → `ChecklistPage`
   - `/tracker/:trackernum/:deviceid` → `MainLayout` → `TrackerSettingsPage`
   - `/vrc-warnings` → `MainLayout` → `VRCWarningsPage`
   - `/firmware-update` → `MainLayout` → `FirmwareUpdate`
   - `/settings/*` → `SettingsLayout` → Subroutes (`trackers`, `serial`, `osc/router`, `osc/vrchat`, `osc/vmc`, `interface`, `interface/home`, `firmware-tool`, `advanced`)
   - `/onboarding/*` → `OnboardingLayout` → Subroutes (`home`, `wifi-creds`, `quiz/*`, `connect-trackers`, `trackers-assign`, `mounting/*`, `body-proportions/*`, `stay-aligned`)

---

## 3. Layout Grid Architecture & Responsive Geometry

### 3.1 Electron Window Geometry (`electron/main/index.ts`)
- **Default Window Size**: `960px × 680px` (stored and validated against screen display bounds in `getWindowStateFile()`).
- **Minimum Enforced Size**:
  - `MIN_WIDTH = 380px`
  - `MIN_HEIGHT = 560px`
- **macOS Window Spec**:
  ```ts
  frame: false,
  titleBarStyle: isMac ? 'hiddenInset' : undefined,
  trafficLightPosition: isMac ? { x: 16, y: 14 } : undefined,
  vibrancy: isMac ? 'under-window' : undefined,
  visualEffectState: isMac ? 'active' : undefined,
  backgroundColor: isMac ? '#00000000' : undefined,
  roundedCorners: true
  ```

### 3.2 CSS Grid Templates (`MainLayout.scss`)

The primary workspace layout uses CSS Grid with variable columns and rows:

#### Desktop `full` Mode (Home & VR Mode):
```scss
.main-layout.full {
  grid-template:
    't t t' var(--topbar-h)
    'n b s' var(--toolbar-h)
    'n c s' calc(100% - var(--topbar-h) - var(--toolbar-h))
    / var(--navbar-w) calc(100% - var(--navbar-w) - var(--right-section-w)) var(--right-section-w);
}
```
- **Area `t`**: `TopBar` (fixed `--topbar-h: 42px`)
- **Area `n`**: `Navbar` (fixed `--navbar-w: 84px`)
- **Area `b`**: `Toolbar` (fixed `--toolbar-h: 96px`, positioned directly above `c`)
- **Area `c`**: Main Content / Dashboard (`Home.tsx`)
- **Area `s`**: Right Sidebar (`Sidebar.tsx`), which spans full height from below `TopBar` to bottom.

#### Right Column Width Allocation (`--right-section-w`):
- `nsm (<900px)`: `40%` of window width
- `sm (900px - 1100px)`: `36%` of window width
- `md (1100px - 1300px)`: `30%` of window width
- `lg (1300px - 1600px)`: `25%` of window width
- `xl (>1600px)`: `22%` of window width

#### Mobile Mode (`@screen mobile`, `<800px`):
```scss
.main-layout.full {
  grid-template:
    't' var(--topbar-h)
    'l' var(--checklist-h)
    'b' var(--toolbar-h)
    'c' calc(100% - var(--topbar-h) - var(--checklist-h) - var(--toolbar-h) - var(--navbar-h))
    'n' calc(var(--navbar-h))
    / 100%;
}
```
- On mobile, `Sidebar` is omitted; `TrackingChecklistMobile` becomes an inline bar `l` (height 30px / 0px when complete), `Toolbar` sits at top, and `Navbar` moves to the bottom (`--navbar-h: 73px`).

### 3.3 Layout Flaws & Dead-Space Diagnostics
1. **Rigid Right Column Locking**:
   - On a default 960x680 window, `--right-section-w` is 36% (approx 345px). Subtracting `--navbar-w` (84px), the main content area `c` is compressed to only ~530px.
   - On compact windows (e.g. 820px), `--right-section-w` takes 40% (328px), leaving under 410px for tracker cards.
   - The user cannot collapse the right sidebar on desktop, forcing a permanent 2-column split even when no 3D preview or checklist action is needed.
2. **TopBar / Content Alignment Asymmetry**:
   - macOS traffic lights require `pl-[78px]` in `TopBar.tsx`, while `Navbar` underneath has fixed `w-[84px]`. The 6px offset creates a slight vertical alignment disconnect between the TopBar logo and the navbar icon column.
3. **Empty Voids in High-Resolution vs Low-Density Tracker Scenarios**:
   - When 0 to 3 trackers are connected on wide displays, the tracker grid has large empty dark backgrounds.
   - `Toolbar.tsx` has fixed height 96px, with reset buttons maintaining a rigid aspect ratio (`aspect-square md:aspect-auto`), leaving large blank areas inside the toolbar container at mid-screen widths.
4. **Three.js Performance Overhead**:
   - The `SkeletonVisualizerWidget` 3D WebGL renderer runs continuously in `Sidebar.tsx` whenever `closed === true`, even if the user is focused entirely on table configuration or settings.

---

## 4. Styling System & Liquid Glass Specification

### 4.1 Token Pipeline & CSS Architecture
- **Theme Switcher**: Supported themes (`dark`, `light`, `trans`, `slime-green`, `slime-yellow`, `slime-orange`, `slime-red`, `asexual`, `snep`). Controlled via `document.documentElement.dataset.theme`.
- **CSS Color Variables**: Defined in RGB decimal triplets (e.g. `--background-80: 16, 17, 20`) to allow Tailwind alpha channel composition `rgb(var(--background-80), <alpha-value>)`.

### 4.2 Liquid Glass Design Tokens (`index.scss`)
```scss
:root[data-theme='dark'] {
  --glass-bg: rgba(34, 35, 40, 0.68);
  --glass-bg-strong: rgba(48, 49, 56, 0.82);
  --glass-bg-interactive: rgba(255, 255, 255, 0.08);
  --glass-bg-interactive-hover: rgba(255, 255, 255, 0.14);
  --glass-border: rgba(255, 255, 255, 0.10);
  --glass-border-strong: rgba(255, 255, 255, 0.18);
  --glass-pill-bg: rgba(255, 255, 255, 0.08);
  --glass-blur: 20px;
  --glass-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.25);
}

:root[data-theme='light'] {
  --glass-bg: rgba(255, 255, 255, 0.68);
  --glass-bg-strong: rgba(255, 255, 255, 0.82);
  --glass-bg-interactive: rgba(0, 0, 0, 0.04);
  --glass-bg-interactive-hover: rgba(0, 0, 0, 0.08);
  --glass-border: rgba(0, 0, 0, 0.10);
  --glass-border-strong: rgba(0, 0, 0, 0.16);
  --glass-pill-bg: rgba(0, 0, 0, 0.05);
  --glass-blur: 20px;
  --glass-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.08);
}
```

### 4.3 Material & Utility Classes
- `.glass-panel`: Standard frosted panel (`backdrop-filter: blur(20px) saturate(180%)`, `border: 1px solid var(--glass-border)`, `box-shadow: var(--glass-shadow)`).
- `.glass-panel-strong`: Elevated surface for dropdowns and popover menus (`blur(24px) saturate(190%)`, `border: 1px solid var(--glass-border-strong)`).
- `.glass-pill`: Rounded badge/chip (`backdrop-filter: blur(12px) saturate(160%)`, `border-radius: 9999px`).
- `.glass-interactive`: Smooth micro-interaction container with hover brightening (`background: var(--glass-bg-interactive-hover)`) and active tactile spring (`transform: scale(0.975)`).

### 4.4 Typography & Font Stack
- **Native macOS Typography**:
  `font-family: var(--font-name), -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'SF Pro', 'Helvetica Neue', 'Noto Sans CJK', sans-serif, emoji;`
- **Dynamic Font Scaling**: `--font-size: 12rem` base token dynamically scalable by user settings; standard title (`--font-size-title`) and VR title (`--font-size-vr`) derive mathematically from the root size.

---

## 5. Right Sidebar & 3D Visualizer Architecture

### 5.1 Internal State & Accordion Logic (`Sidebar.tsx`)
`Sidebar.tsx` manages an accordion toggle between two child modules:
1. `TrackingChecklist` (Height: `closed ? '90px' : 'calc(100% - 16px)'`)
2. `PreviewSection` (Height: `closed ? 'calc(100% - 90px - 24px)' : '0%'`)

- When `closed === true`:
  - Checklist collapses to a 90px summary header showing overall tracking status (complete/incomplete/partial) and a Slime avatar.
  - 3D Skeleton Visualizer expands into the remaining vertical space.
- When `closed === false`:
  - Checklist expands to show all checklist steps (SteamVR status, WiFi channel, tracker assignments, mounting calibration, proportions).
  - 3D Skeleton Visualizer collapses to height `0%`.

### 5.2 3D Visualizer Controls (`PreviewControls`)
The skeleton visualizer features embedded HUD controls:
- Top-left: Estimated user height pill (`Intl.NumberFormat` formatted cm badge).
- Top-right: Eye toggle icon (`disabledRender` state toggling Three.js render loop).
- Bottom center: Action pill containing BVH Recording toggle (with pulse animation), Pause Tracking toggle (Play/Pause icon), and Mocap mode indicator.

### 5.3 Opportunities for Collapsible Overlay / Unification
- **Drawer / Overlay Transformation**: Rather than permanently consuming 22-40% of grid width, the right sidebar can support an unpinned/collapsed state where the main grid spans 100% (minus navbar), and the 3D skeleton/checklist slides out as a floating glass panel on demand.
- **Smart Render Throttling**: Tying Three.js rendering to panel visibility (`IntersectionObserver` or explicit `isOpen` state) avoids GPU/CPU battery drain on macOS laptops.

---

## 6. Key UI Components & Interactive States

### 6.1 Component Catalog

| Component | Location | Role & Visual Architecture |
|---|---|---|
| `TopBar` | `gui/src/components/TopBar.tsx` | macOS title bar, drag region, traffic-light inset, version chip, server IP badge, progress bar, docs link. |
| `Navbar` | `gui/src/components/Navbar.tsx` | 84px left navigation bar with 6 SVG icon buttons, active indicator pill, hover states. |
| `Toolbar` | `gui/src/components/Toolbar.tsx` | 96px action strip with drift reset & mounting calibration buttons, progress countdown animations. |
| `PresetSelector` | `gui/src/components/home/PresetSelector.tsx` | Glass pill dropdown for fast tracker preset switching (Full Body, Lower Body, Core) + preset manager modal. |
| `QuestDiagnosticsPill` | `gui/src/components/home/QuestDiagnosticsPill.tsx` | Header status pill displaying live active hardware count, VRChat OSC port 9000 diagnostics, and backend health. |
| `TrackerCard` | `gui/src/components/tracker/TrackerCard.tsx` | Card view for individual trackers with body part icon, battery percentage/voltage/runtime pill, WiFi RSSI/ping pill, and velocity shake glow. |
| `TrackersTable` | `gui/src/components/tracker/TrackersTable.tsx` | High-density data table view for large tracker fleets with sort/filter, rotation Euler vectors, TPS, and packet loss metrics. |
| `Button` | `gui/src/components/commons/Button.tsx` | Primary, secondary, tertiary, and quaternary button styles with loading spinner and active scale feedback. |
| `BaseModal` | `gui/src/components/commons/BaseModal.tsx` | Centered modal dialog wrapper with backdrop blur (`bg-background-90/60`), ESC/backdrop click dismissal. |
| `Dropdown` | `gui/src/components/commons/Dropdown.tsx` | Accessible select menu with react-hook-form integration, scroll-into-view keyboard navigation. |
| `TipBox` / `WarningBox` | `gui/src/components/commons/TipBox.tsx` | Accent-tinted alert boxes for informational tips and calibration warnings. |

### 6.2 Interactive & Micro-Interaction States
- **Button Feedback**: `active:scale-[0.98]` and `transition-all duration-150` across all interactive buttons.
- **Velocity Shake Glow**: Trackers physically moving in real life emit a dynamic box shadow glow:
  ```ts
  boxShadow: `0px 0px ${Math.floor(velocity * 8)}px ${Math.floor(velocity * 8)}px rgb(var(--accent-background-30))`
  ```
- **Countdown Animations**: Reset buttons animate using `@keyframes timer-tick`, `@keyframes spin-ccw`, and `@keyframes skiing`.

---

## 7. Build Verification & Integrity Confirmation

- **TypeScript Compilation**: `pnpm tsc --noEmit` verifies 0 errors across all types and schemas.
- **Protocol Safety**: 100% frontend boundary preserved; SolarXR protocol schemas, flatbuffers RPC packets, and Electron IPC handlers remain untouched and fully intact.

---

*Survey compiled and verified by explorer_survey_1.*
