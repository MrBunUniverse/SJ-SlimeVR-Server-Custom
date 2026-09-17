# 5-Component Handoff Report: UI/UX Architecture & Layout Survey

**Agent**: `explorer_survey_1` (UI/UX Layout Explorer)  
**Report Type**: Hard Handoff (Task Complete)  
**Deliverable File**: `/Volumes/Mac HDD/Win HDD Secondary/Documents/Mac Docs/Project/Programing Project/SJ SlimeVR Sever/.agents/explorer_survey_1/survey.md`  

---

## 1. Observation

1. **Electron Window Configuration (`gui/electron/main/index.ts:205-274`)**:
   - Default dimensions: `width: 960.0`, `height: 680.0`.
   - Minimum dimensions: `minWidth: 380`, `minHeight: 560`.
   - macOS title bar configuration: `frame: false`, `titleBarStyle: 'hiddenInset'`, `trafficLightPosition: { x: 16, y: 14 }`, `vibrancy: 'under-window'`, `visualEffectState: 'active'`, `backgroundColor: '#00000000'`, `roundedCorners: true`.
2. **CSS Grid Layout Areas (`gui/src/components/MainLayout.scss:7-42`)**:
   - Grid areas: `t` (TopBar, 42px), `n` (Navbar, 84px), `b` (Toolbar, 96px), `c` (Home Content / Tracker List), `s` (Right Sidebar, 22% - 40%).
   - Right section percentage width breakpoints:
     - `nsm (<900px)`: `--right-section-w: 40%`
     - `sm (900px-1100px)`: `--right-section-w: 36%`
     - `md (1100px-1300px)`: `--right-section-w: 30%`
     - `lg (1300px-1600px)`: `--right-section-w: 25%`
     - `xl (>1600px)`: `--right-section-w: 22%`
   - Mobile breakpoint (`mobile: not (min-width: 800px)`): Switches to single column stack with `--navbar-h: 73px` at bottom and `--checklist-h: 30px` (or 0px).
3. **Right Sidebar Structure & Accordion (`gui/src/components/Sidebar.tsx:203-251`)**:
   - Manages state `closed` (default `true`) and `closing`.
   - `TrackingChecklist` size: `closed ? '90px' : 'calc(100% - 16px)'`.
   - `PreviewSection` size: `closed ? 'calc(100% - 90px - 24px)' : '0%'`.
   - Houses `SkeletonVisualizerWidget` (Three.js WebGL canvas + `OrbitControls`), height pill badge, BVH record button, tracking pause button, and render toggle eye icon.
4. **Liquid Glass Design System Tokens (`gui/src/index.scss:103-113, 280-289, 316-325, 471-509`)**:
   - Design tokens: `--glass-bg`, `--glass-bg-strong`, `--glass-bg-interactive`, `--glass-bg-interactive-hover`, `--glass-border`, `--glass-border-strong`, `--glass-pill-bg`, `--glass-blur: 20px`, `--glass-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.25)`.
   - Classes: `.glass-panel`, `.glass-panel-strong`, `.glass-pill`, `.glass-interactive`.
   - Native macOS font stack: `font-family: var(--font-name), -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'SF Pro', 'Helvetica Neue', 'Noto Sans CJK', sans-serif, emoji;`
   - Accessibility media queries: `@media (prefers-reduced-transparency: reduce)` and `@media (prefers-reduced-motion: reduce)`.
5. **Dashboard & Fleet Components (`gui/src/components/home/Home.tsx:61-175`)**:
   - Header action pill row: `PresetSelector` (preset dropdown + manage modal) and `QuestDiagnosticsPill` (VRChat OSC port 9000 diagnostics & active hardware count).
   - Layout toggle button: Switch between `TrackerCard` (grid view with velocity shake glow and hardware status pills) and `TrackersTable` (high-density data rows with rotation Euler vectors).

---

## 2. Logic Chain

1. **Grid Allocation Reasoning**:
   - Observation 2 demonstrates that on default desktop windows (960x680 down to 800px), `--right-section-w` locks 36% to 40% of the entire window to the right column (`s`), leaving only ~450px for the tracker fleet in column `c`.
   - Observation 3 shows that `Sidebar.tsx` only allows vertical toggling between the checklist and 3D preview within the locked right column, with no capability to collapse or minimize the column horizontally.
   - Therefore, a key architectural opportunity is enabling a collapsible/floating right panel so that the tracker fleet can utilize 100% of the main window when the 3D visualizer is not actively inspected.
2. **Material Consistency Reasoning**:
   - Observation 4 confirms that Liquid Glass design tokens and utility classes (`.glass-panel`, `.glass-pill`, `.glass-interactive`) are properly declared in `index.scss` and supported across all 9 theme variants.
   - Observation 1 and 4 confirm native macOS typography (`SF Pro`) and vibrancy under-window window settings are configured.
3. **Component Integrity Reasoning**:
   - Observation 5 confirms all core interactive controls (`PresetSelector`, `QuestDiagnosticsPill`, `Toolbar`, `ResetButton`, `TrackersTable`, `TrackerCard`) operate strictly through frontend Jotai atoms (`assignedTrackersAtom`, `connectedIMUTrackersAtom`) and WebSocket RPC without altering backend logic.

---

## 3. Caveats

- **WebGL Canvas Lifecycle**: When collapsing the 3D skeleton visualizer into an overlay or hidden tab, the Three.js render loop should be paused (or unmounted) to prevent unnecessary GPU/battery consumption on macOS laptops.
- **Breakpoint Transitions**: Breakpoint transitions below 800px (`@screen mobile`) switch the entire grid from a multi-column desktop layout to a single-column mobile stack. Any changes to desktop grid templates must maintain compatibility with mobile rules.

---

## 4. Conclusion

The SlimeVR GUI has a robust React + Electron architecture with native macOS window integration and Liquid Glass tokens. The primary layout limitation is the rigid, uncollapsible right sidebar grid column (`22% - 40%` width), which causes cramped content columns on compact windows (960x680 down to 800x560). Converting the right sidebar into a collapsible panel or floating drawer, alongside fine-tuning the 16-24px corner radiuses and high-density tracker table views, will deliver a fluid, minimalist single-window macOS utility.

---

## 5. Verification Method

- **TypeScript Verification**:
  ```bash
  cd "/Volumes/Mac HDD/Win HDD Secondary/Documents/Mac Docs/Project/Programing Project/SJ SlimeVR Sever/gui"
  pnpm tsc --noEmit
  ```
- **Files to Inspect**:
  - `gui/src/components/MainLayout.scss`
  - `gui/src/components/Sidebar.tsx`
  - `gui/src/components/TopBar.tsx`
  - `gui/src/components/home/Home.tsx`
  - `gui/src/index.scss`
- **Invalidation Condition**: Any syntax error, broken import, or layout breakdown under window resize from 960x680 down to 380x560.
