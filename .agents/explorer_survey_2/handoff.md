# Handoff Report — Tracker Fleet Management, State Stores & Quest/OSC Monitoring Survey

**Agent:** `explorer_survey_2` (Tracker & State Explorer)  
**Date:** 2026-09-02T13:46:00+07:00  
**Status:** Complete (Hard Handoff)

---

## 1. Observation

Direct inspection of `gui/` and `solarxr-protocol/` files revealed the exact architecture of state management, tracker rendering, diagnostic monitoring, and network protocols:

1. **State Store (`gui/src/store/app-store.ts`)**:
   - Lines 1-122: Implements Jotai atoms for real-time telemetry (`datafeedAtom = atom(new DataFeedUpdateT())`, `bonesAtom = atom<BoneT[]>([])`), with memoized selectors (`devicesAtom`, `serverGuardsAtom`, `flatTrackersAtom`, `assignedTrackersAtom`, `unassignedTrackersAtom`, `connectedTrackersAtom`, `connectedIMUTrackersAtom`, `stayAlignedPoseAtom`, `trackerFromIdAtom`) using `selectAtom` and `@react-hookz/deep-equal`'s `isEqual`.
2. **WebSocket & RPC Subsystem (`gui/src/hooks/websocket-api.ts`, `gui/src/hooks/app.ts`)**:
   - `websocket-api.ts` lines 38-240: Connects to `ws://${targetIp}:${targetPort}` (default port `21110`). Receives binary `Blob` data, deserializes FlatBuffers `MessageBundle` via `MessageBundle.getRootAsMessageBundle(fbb).unpack()`, and dispatches events across `EventTarget` listeners (`rpclistenerRef`, `datafeedlistenerRef`, `pubsublistenerRef`).
   - `app.ts` lines 25-91: Initializes `StartDataFeedT` with `dataFeedConfig` and `bonesDataFeedConfig`. Listens to `DataFeedMessage.DataFeedUpdate` to write packet updates into `datafeedAtom` (index 0) and `bonesAtom` (index 1). Listens to `RpcMessage.ResetResponse` for sound cues.
3. **Tracker Fleet Rendering (`gui/src/components/tracker/`, `gui/src/components/home/`)**:
   - `Home.tsx` lines 61-175: Switches between Card View (`config?.homeLayout === 'default'`) and Row View (`config?.homeLayout === 'table'`). Renders assigned vs unassigned tracker sections.
   - `TrackerCard.tsx` lines 21-213: `TrackerSmol` (height 70px) renders body part icon, warning badge, tracker name, `TrackerStatus` pill, `TrackerBattery` (percentage/voltage/runtime), `TrackerWifi` (RSSI/ping), and dynamic physical shake highlight glow (`boxShadow: 0px 0px ${velocity * 8}px ...`).
   - `TrackersTable.tsx` lines 215-392: Multi-column high-density data grid displaying Name, Manufacturer, Battery, Ping/RSSI/Packet Loss, TPS, Euler Rotation degrees (raw vs reference adjusted), Temperature, and optional dev columns (Linear Acc, Position, Stay-Aligned, UDP URL).
4. **Quest / OSC / VRChat Diagnostics (`gui/src/components/home/QuestDiagnosticsPill.tsx`, `gui/src/components/settings/pages/VRCOSCSettings.tsx`, `gui/src/components/vrc/VRCWarningsPage.tsx`)**:
   - `QuestDiagnosticsPill.tsx` lines 9-105: Header pill showing real-time backend connection LED, active tracker count, and a flyout popover detailing OSC status (`Ready / Port 9000`), active hardware, and quick links to OSC & Serial settings.
   - `VRCOSCSettings.tsx` lines 29-149: Configures VRChat OSC network ports (In: 9001, Out: 9000, Address: 127.0.0.1, OSCQuery enabled) and individual tracker bone broadcasts.
   - `VRCWarningsPage.tsx` lines 101-302: Diagnostics matrix tracking 9 avatar tracking parameters via `VRCConfigStateRequest` and allows setting mutes.
5. **Presets, Skeletons, Mounting & Resets (`gui/src/hooks/presets.ts`, `gui/src/components/onboarding/BodyAssignment.tsx`, `gui/src/components/onboarding/pages/mounting/MountingSelectionMenu.tsx`, `gui/src/hooks/reset.ts`, `gui/src/components/Toolbar.tsx`)**:
   - `presets.ts` lines 11-40: Default presets (`minimal` [3], `five-tracker` [5], `full-body` [8], `sitting` [4]) managed with localStorage persistence.
   - `BodyAssignment.tsx` lines 60-97: Assignment modes (`LowerBody`, `Core`, `EnhancedCore`, `FullBody`, `All`) and kinematic dependency rules (`ASSIGNMENT_RULES`).
   - `MountingSelectionMenu.tsx` lines 219-345: 8-direction SVG circular pie selector mapping rotation angles to `solarxr-protocol` quaternions.
   - `reset.ts` lines 30-172 & `Toolbar.tsx` lines 145-217: Guarded reset buttons for Full Reset (`ResetType.Full`), Yaw Reset (`ResetType.Yaw`), and Mounting Reset (`ResetType.Mounting` default, feet, fingers) with progress timers, spin/ski animations, and server guard validations (`serverGuards.canDoMounting`, `serverGuards.canDoYawReset`).

---

## 2. Logic Chain

1. **Premise**: SlimeVR UI redesign requires full awareness of data flows and components to ensure no backend safety guardrails or tracker monitoring features are compromised during UI refactoring.
2. **Analysis of State & Telemetry**:
   - Telemetry streams asynchronously from the SlimeVR backend over WebSocket binary FlatBuffers into Jotai atoms (`datafeedAtom`).
   - Because Jotai uses granular atom subscriptions with deep equality checks, UI layout updates (e.g. reorganizing cards, tables, sidebars) operate purely as consumers of atoms without altering the underlying data ingestion loop.
3. **Analysis of UI Components & Diagnostics**:
   - Tracker cards (`TrackerCard`) and table rows (`TrackersTable`) consume `useTracker`, `useConfig`, and `useTrackingChecklist`.
   - Quest and OSC diagnostics in `QuestDiagnosticsPill` and `VRCOSCSettings` provide essential real-time feedback on OSC transmission and tracker counts.
   - Reset actions in `Toolbar.tsx` enforce safety rules through `serverGuardsAtom`.
4. **Inference**:
   - Redesigning the layout grid, liquid glass materials, and compact viewports can be accomplished 100% on the frontend by composing these existing stores and hooks without modifying backend protocol schemas or altering RPC packet payloads.

---

## 3. Caveats

- **Network Mode**: Investigation was conducted locally on code without modifying source files (read-only survey).
- **Firmware Flashing Subsystem**: While firmware release checking (`fetchCurrentFirmwareRelease`, `FirmwareIcon`) was surveyed, deep serial flashing internals in `firmware-tool-api/` were kept secondary to the core tracker fleet and OSC monitoring scope.
- **Three.js 3D Viewport**: `SkeletonVisualizerWidget` relies on WebGL canvas resizing inside the right sidebar.

---

## 4. Conclusion

1. The SlimeVR UI state architecture is cleanly decoupled via Jotai atoms and React context hooks, making UI styling, responsive compaction, and layout re-arrangements straightforward and safe.
2. High-density row view and variable card modes are already natively supported via `config.homeLayout` and can be styled with Liquid Glass aesthetics.
3. Quick presets (`PresetSelector`), live diagnostics (`QuestDiagnosticsPill`), and guarded reset controls (`Toolbar` / `ResetButton`) are fully implemented and can be cleanly integrated into macOS utility header and bottom toolbar regions.
4. Complete architectural findings have been documented in `.agents/explorer_survey_2/survey.md`.

---

## 5. Verification Method

To independently verify the observations and schema models identified in this survey:

1. **Verify TypeScript Compilation and Build**:
   ```bash
   cd "/Volumes/Mac HDD/Win HDD Secondary/Documents/Mac Docs/Project/Programing Project/SJ SlimeVR Sever/gui"
   pnpm exec tsc --noEmit
   ```
2. **Inspect Core State & Component Files**:
   - State Stores: `gui/src/store/app-store.ts`
   - WebSocket & RPC: `gui/src/hooks/websocket-api.ts`, `gui/src/hooks/app.ts`
   - Tracker Components: `gui/src/components/tracker/TrackerCard.tsx`, `gui/src/components/tracker/TrackersTable.tsx`
   - Diagnostics & Presets: `gui/src/components/home/QuestDiagnosticsPill.tsx`, `gui/src/components/home/PresetSelector.tsx`
   - Reset Controls: `gui/src/hooks/reset.ts`, `gui/src/components/Toolbar.tsx`
   - SolarXR FlatBuffers Schemas: `solarxr-protocol/schema/data_feed/tracker.fbs`, `solarxr-protocol/schema/data_feed/device_data.fbs`
