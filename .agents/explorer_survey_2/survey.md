# SlimeVR GUI — Comprehensive Survey: Tracker Fleet Management, State Stores & Quest/OSC Monitoring

**Survey Date:** 2026-09-02  
**Surveyor:** `explorer_survey_2` (Tracker & State Explorer)  
**Target Scope:** `gui/` (React 18 + Electron + Jotai + Tailwind/SCSS + FlatBuffers SolarXR Protocol)

---

## Executive Summary

The SlimeVR frontend application (`gui/`) manages a distributed fleet of IMU-based and synthetic motion tracking hardware. Real-time telemetry, spatial orientations, skeleton kinematics, and configuration commands flow over a binary WebSocket connection using FlatBuffers protocol buffers (`solarxr-protocol`). State is orchestrated via a hybrid architecture consisting of **Jotai reactive atoms** for high-frequency data feeds, **React Context** providers for global services, and custom hooks interfacing with FlatBuffers RPC dispatchers.

The tracking interface provides dual representation modes (compact card grid and dense tabular row view), comprehensive telemetry pills (battery, WiFi RSSI/ping, packet loss, temperature, IMU drift/status), quick presets, interactive skeleton mapping, multi-stage mounting calibration, guard-checked reset shortcuts (Yaw, Full, Mounting), and real-time Quest/VRChat OSC & OSCQuery monitoring.

---

## 1. State Management Mechanisms in `gui/`

### 1.1 Jotai Reactive Atom Architecture (`gui/src/store/app-store.ts`)
The core tracker data feed is managed using **Jotai** (`jotai` v2.12.2) combined with `jotai/utils` (`selectAtom`) and deep equality checks (`@react-hookz/deep-equal`'s `isEqual`) to avoid unnecessary React re-renders during high-frequency data stream updates.

```typescript
// Core DataFeed atoms
export const datafeedAtom = atom(new DataFeedUpdateT());
export const bonesAtom = atom<BoneT[]>([]);
export const ignoredTrackersAtom = atom(new Set<string>());

// Derived selectors with deep equality caching
export const devicesAtom = selectAtom(datafeedAtom, (d) => d.devices, isEqual);
export const serverGuardsAtom = selectAtom(datafeedAtom, (d) => d.serverGuards, isEqual);
export const stayAlignedPoseAtom = selectAtom(datafeedAtom, (d) => d.stayAlignedPose, isEqual);
export const computedTrackersAtom = selectAtom(
  datafeedAtom,
  (d) => d.syntheticTrackers.map((tracker) => ({ tracker })),
  isEqual
);

// Flattened & Filtered Tracker Selectors
export const flatTrackersAtom = atom((get) => {
  const devices = get(devicesAtom);
  return devices.flatMap<FlatDeviceTracker>((device) =>
    device.trackers.map((tracker) => ({ tracker, device }))
  );
});

export const assignedTrackersAtom = atom((get) =>
  get(flatTrackersAtom).filter(({ tracker }) => tracker.info?.bodyPart !== BodyPart.NONE)
);

export const unassignedTrackersAtom = atom((get) =>
  get(flatTrackersAtom).filter(({ tracker }) => tracker.info?.bodyPart === BodyPart.NONE)
);

export const connectedTrackersAtom = atom((get) =>
  get(flatTrackersAtom).filter(({ tracker }) => tracker.status !== TrackerStatus.DISCONNECTED)
);

export const connectedIMUTrackersAtom = atom((get) =>
  get(connectedTrackersAtom).filter(({ tracker }) => tracker.info?.isImu)
);

export const hasHMDTrackerAtom = atom((get) =>
  get(flatTrackersAtom).some(
    (t) => t.tracker.info?.bodyPart === BodyPart.HEAD &&
           (t.tracker.info.isHmd || t.tracker.position?.y !== undefined)
  )
);
```

### 1.2 React Context Providers (`gui/src/components/providers/`)
1. **`WebSocketApiContext` (`gui/src/hooks/websocket-api.ts`)**:
   - Manages WebSocket connection to `ws://localhost:21110` (or `?ip=...&port=...`).
   - Uses browser native `EventTarget` instances (`rpclistenerRef`, `datafeedlistenerRef`, `pubsublistenerRef`) to distribute deserialized FlatBuffers events to active React subscribers without re-rendering the provider.
   - Provides methods: `useRPCPacket<T>(type, callback)`, `useDataFeedPacket<T>(type, callback)`, `usePubSubPacket<T>(type, callback)`, `sendRPCPacket(type, data)`, `sendDataFeedPacket(type, data)`, `sendPubSubPacket(type, data)`.
2. **`AppContext` (`gui/src/hooks/app.ts`)**:
   - Initializes data feed subscriptions (`StartDataFeedT`) on connect.
   - Listens to `DataFeedMessage.DataFeedUpdate` packets (index 0 updates `datafeedAtom`, index 1 updates `bonesAtom`).
   - Listens to `RpcMessage.ResetResponse` to trigger reset sound effects (`handleResetSounds`).
   - Continuously monitors firmware releases via `fetchCurrentFirmwareRelease`.
   - Manages Sentry error reporting context with active device inventory.
3. **`ConfigContext` (`gui/src/hooks/config.ts`)**:
   - Persistent client-side configuration stored in `localStorage`.
   - Properties: `homeLayout` (`'default'` | `'table'`), `theme`, `lang`, `feedbackSound`, `feedbackSoundVolume`, `useTray`, `connectedTrackersWarning`, `assignMode`, `mirrorView`, `skeletonPreview`, `debug`, `devSettings` (`fastDataFeed`, `preciseRotation`, `rawSlimeRotation`, `moreInfo`, `sortByName`, `filterSlimesAndHMD`, `highContrast`).
4. **`TrackingChecklistProvider` (`gui/src/hooks/tracking-checklist.ts`)**:
   - Tracks calibration steps, detects first blocking step, computes overall progress and completion status (`'complete' | 'partial' | 'incomplete'`), and highlights specific invalid tracker IDs (`highlightedTrackers`).
5. **`LangContext` (`gui/src/i18n/config.tsx`)**:
   - Fluent React localization wrapper (`@fluent/react`, `@fluent/bundle`).
6. **`TrackerRowProvider` (`gui/src/components/tracker/TrackersTable.tsx`)**:
   - Provides scoped `FlatDeviceTracker` context to table row cells.

### 1.3 Key Hook Subsystems
- **`useTracker(tracker)` (`gui/src/hooks/tracker.ts`)**:
  - `useName()`: Resolves tracker name with fallback order: custom name -> localized body part -> display name -> `'NONE'`.
  - `useRawRotationEulerDegrees()`, `useRefAdjRotationEulerDegrees()`, `useIdentAdjRotationEulerDegrees()`: Convert FlatBuffers quaternion to Three.js Euler degrees.
  - `useVelocity()`: Calculates physical motion magnitude over a sliding window (comparing rotational and linear acceleration deltas over 0.3s) for the visual "shake to identify" highlight effect.
- **`useTrackerFromId(trackerNum, deviceId)`**: Memoized Jotai selector extracting a single tracker from `flatTrackersAtom`.
- **`useReset(options, onReseted, onFailed)` (`gui/src/hooks/reset.ts`)**:
  - Handles Full Reset, Yaw Reset, and Mounting Resets (default, feet, fingers).
  - Handles state machine: `idle` -> `counting` -> `finished` (with countdown timer).
  - Server guards validation: verifies backend allows mounting/yaw reset (`serverGuards.canDoMounting`, `serverGuards.canDoYawReset`).
- **`useTrackerPresets()` (`gui/src/hooks/presets.ts`)**: Quick presets manager (Minimal, 5-Tracker, Full Body, Sitting) with localStorage sync.
- **`useVRCConfig()` (`gui/src/hooks/vrc-config.ts`)**: VRChat OSC/OSCQuery configuration validator and setting muting.
- **`useDataFeedConfig()` (`gui/src/hooks/datafeed-config.ts`)**: Masks selecting telemetry fields and configuring stream tick rate (10 TPS vs 90 TPS fast feed).

---

## 2. Tracker Fleet Representation & Rendering

### 2.1 Dual Layout Modes (`gui/src/components/home/Home.tsx`)
The home dashboard supports toggling between **Card View (`homeLayout: 'default'`)** and **Row View (`homeLayout: 'table'`)**.

Both layouts cleanly partition trackers into two logical groups:
1. **Assigned Trackers (`assignedTrackersAtom`)**: Trackers with `bodyPart !== BodyPart.NONE`.
2. **Unassigned Trackers (`unassignedTrackersAtom`)**: Trackers awaiting body role assignment (`bodyPart === BodyPart.NONE`).

### 2.2 Tracker Cards (`gui/src/components/tracker/TrackerCard.tsx`)
- **`TrackerSmol` (Compact Card, 70px height)**:
  - Left: Body part SVG icon with 2px warning outline + WarningIcon overlay when flagged by `TrackingChecklist`.
  - Center: Tracker name (bold, truncated) + status pill (`TrackerStatus`).
  - Right: Battery health pill (`TrackerBattery`) + WiFi health pill (`TrackerWifi`).
  - Hover/Shake interaction: Smooth scaling with dynamic glowing box shadow proportional to physical movement velocity (`boxShadow: 0px 0px ${velocity * 8}px ...`).
  - Update badge: Top-left `FirmwareIcon` badge if an update is pending or battery is too low.
- **`TrackerBig` (Detailed Vertical Card, 128px height)**:
  - Used on Tracker Settings page and standalone cards.
  - Centered body part icon, bold name, status pill, multi-attribute battery (voltage + percentage + runtime), and WiFi (ping + RSSI).

### 2.3 Tracker High-Density Rows (`gui/src/components/tracker/TrackersTable.tsx`)
- High-density CSS grid table with responsive columns:
  - `Name` (`minmax(15rem, 1.5fr)`): Icon, custom/assigned name, status pill, warning icon.
  - `Type` (`9rem`): Device manufacturer / board model.
  - `Battery` (`9rem`): Percentage, voltage, runtime estimate.
  - `Ping/Signal` (`9rem`): Ping (ms), RSSI (dBm), packet loss percentage (`packetsLost / packetsReceived`).
  - `TPS` (`5rem`): Processed ticks per second.
  - `Rotation` (`9rem` / `11rem` if precise): Euler degrees `(X, Y, Z)` (reference-adjusted or raw).
  - `Temperature` (`9rem`): Sensor temperature in °C.
  - *Optional Dev Columns (`moreInfo: true`)*: Linear acceleration vector, solved 3D position vector, Stay-Aligned drift offset, UDP IP Address (`udp://x.x.x.x`).

### 2.4 Multi-Attribute Health Pills & Badges
| Component | Visual Indicators | Telemetry Source |
|---|---|---|
| **`TrackerStatus.tsx`** | Color dot + localized label: OK (Green), BUSY/OCCLUDED/TIMED_OUT (Yellow), ERROR (Red), DISCONNECTED (Grey). Glass-pill container. | `tracker.status` (Enum: `TrackerStatus`) |
| **`TrackerBattery.tsx`** | Dynamic battery fill icon (green/yellow/red), charging indicator (>4.3V), remaining hours/minutes estimate (`batteryRuntimeEstimate / 3600000000`), percentage, optional voltage. | `device.hardwareStatus.batteryPctEstimate`, `batteryVoltage`, `batteryRuntimeEstimate` |
| **`TrackerWifi.tsx`** | Signal strength bars icon (derived from RSSI), ping in ms, RSSI in dBm, packet loss percentage with tooltip. | `device.hardwareStatus.rssi`, `ping`, `packetLoss`, `packetsLost`, `packetsReceived` |
| **`FirmwareIcon.tsx`** | Firmware badge with update available indicator or low battery / incompatible warnings. | `tracker.device.hardwareInfo`, `currentFirmwareRelease` |
| **`StayAlignedInfo.tsx`** | Drift angle / correction status for Stay-Aligned sensor fusion. | `tracker.stayAligned` |

---

## 3. Quest / OSCQuery / VRChat Tracking Diagnostics & Header Monitoring

### 3.1 Live Diagnostics Pill in Dashboard Subheader (`QuestDiagnosticsPill.tsx`)
Located in the dashboard subheader alongside the preset picker:
- **Collapsed State**:
  - Pulsing status LED: Green (Backend online & >0 IMUs active), Yellow (Backend online but no active IMUs), Red (Backend offline).
  - Label: `"X Trackers Active"` or `"Backend Disconnected"`.
- **Diagnostics Flyout Popover**:
  - Backend connection status (Connected / Offline).
  - Quest / VRChat OSC pipeline status (`Ready / Port 9000` or `Unavailable`).
  - Assigned trackers count (`assignedTrackers.length`).
  - Active hardware devices count (`connectedIMUTrackers.length`).
  - Quick action links: `OSC Settings →` (`/settings/vrchat`) and `Serial Monitor` (`/settings/serial`).

### 3.2 TopBar System Status (`TopBar.tsx`)
- Displays SlimeVR logo, version tag (`__VERSION_TAG__` / `__COMMIT_HASH__`), and active local IP address in settings mode (`ServerInfosResponseT.localIp`).
- Multi-step progress bar for onboarding wizards (`progress` prop).
- Settings shortcut (`/settings/trackers`), documentation link, and macOS/Electron window controls.

### 3.3 VRChat OSC & OSCQuery Protocol Configuration (`VRCOSCSettings.tsx`)
- **OSC Network Configuration**:
  - Port In (default: `9001` - receive from VRChat).
  - Port Out (default: `9000` - send to VRChat/Quest).
  - Destination Address (default: `127.0.0.1` or Quest LAN IP).
  - OSCQuery Protocol Toggle (auto-discovery of OSC endpoints).
- **VRChat Tracker Subscriptions**:
  - Individual toggle switches: Head, Chest, Waist/Hip, Knees, Feet, Elbows, Hands.
- **RPC Messages**:
  - Read: `RpcMessage.SettingsRequest` -> `RpcMessage.SettingsResponse` (`VRCOSCSettingsT`).
  - Write: `RpcMessage.ChangeSettingsRequest` (`ChangeSettingsRequestT`).

### 3.4 VRChat Diagnostic Rule Engine (`VRCWarningsPage.tsx`, `useVRCConfig.ts`)
Queries the SlimeVR backend's active VRChat configuration validator via `VRCConfigStateRequest`:
- Evaluates 9 key tracking settings:
  1. `userHeightOk`: Match between SlimeVR calculated user height and VRChat avatar height.
  2. `legacyModeOk`: Avoid legacy OSC modes when modern modes are available.
  3. `shoulderTrackingOk`: Recommended shoulder tracking state.
  4. `shoulderWidthCompensationOk`: Shoulder compensation alignment.
  5. `calibrationVisualsOk`: VRChat calibration visuals enabled.
  6. `calibrationRangeOk`: Recommended calibration distance range.
  7. `trackerModelOk`: Recommended tracker visual model (`AXIS`, `BOX`, `SPHERE`, `SYSTEM`).
  8. `spineModeOk`: Spine tracking mode (`LOCK_BOTH`, `LOCK_HEAD`, `LOCK_HIP`).
  9. `avatarMeasurementTypeOk`: Measurement basis (`HEIGHT` vs `ARM_SPAN`).
- Allows users to mute individual warnings via `RpcMessage.VRCConfigSettingToggleMute`.

---

## 4. Tracker Presets, Skeleton Mapping, Mounting & Resets

### 4.1 Quick Presets System (`gui/src/hooks/presets.ts`, `PresetSelector.tsx`)
Allows one-click switching between hardware layout configurations:
- **`Minimal (Core)`**: 3 Trackers (Waist, Left Foot, Right Foot) — Seated/standing baseline.
- **`Standard (5-Tracker)`**: 5 Trackers (Waist, Left/Right Lower Leg, Left/Right Foot) — Full leg tracking.
- **`Full Body (Enhanced)`**: 8 Trackers (Chest, Waist, Left/Right Upper Leg, Left/Right Lower Leg, Left/Right Foot).
- **`Sitting Mode`**: 4 Trackers (Chest, Waist, Left Foot, Right Foot) — Desktop chair optimization.
- **Preset Management Modal**: Allows creating custom presets, duplicating presets, and deleting unused configurations with localStorage persistence.

### 4.2 Skeleton Mapping & Body Assignment (`BodyAssignment.tsx`, `BodyDisplay.tsx`)
- **Visual 2D Skeleton Mannequin (`PersonFrontIcon.tsx`)**:
  - Vector SVG body diagram with dedicated `.body-part-circle` DOM anchor points.
  - Dynamically computes bounding boxes (`getBoundingClientRect`) and overlays animated dot indicators with velocity glow.
- **Assignment Modes (`ASSIGNMENT_MODES`)**:
  - `LowerBody` (5 trackers), `Core` (6 trackers), `EnhancedCore` (8 trackers), `FullBody` (10 trackers), `All` (up to 20 body parts).
- **Kinematic Hierarchy Rules (`ASSIGNMENT_RULES`)**:
  - Enforces physiological bone continuity (e.g. Feet require Lower Legs -> Upper Legs -> Spine; Hip/Waist require Chest).
  - Emits localized role error badges when disjointed configurations are detected.
- **Single Tracker Assignment Modal (`SingleTrackerBodyAssignmentMenu.tsx`)**:
  - Interactive body mannequin with neck choker safety warning modal (`NeckWarningModal`).

### 4.3 Mounting Calibration (`MountingSelectionMenu.tsx`, `AutomaticMounting.tsx`)
- **Manual Mounting Radial Selector (`MountingSelectionMenu.tsx`)**:
  - 8-direction SVG circular pie selector: `LEFT`, `FRONT_LEFT`, `FRONT`, `FRONT_RIGHT`, `RIGHT`, `BACK_RIGHT`, `BACK`, `BACK_LEFT`.
  - Quaternions generated via `MountingOrientationDegreesToQuatT` and mapped to `solarxr-protocol`'s `AssignTrackerRequestT`.
- **Automatic Mounting Wizard (`AutomaticMountingPage.tsx`)**:
  - Stepper slider: 1. Put Trackers On -> 2. Preparation (Stand upright) -> 3. Mounting Reset (Perform Ski Pose and trigger reset).

### 4.4 Reset Shortcuts & Guarded Actions (`ResetButton.tsx`, `Toolbar.tsx`, `useReset.ts`)
- **Action Types**:
  1. **Full Reset (`ResetType.Full`)**: Resets all yaw and pitch orientation offsets relative to HMD yaw.
  2. **Yaw Reset (`ResetType.Yaw`)**: Instant yaw-only realignment.
  3. **Mounting Reset (`ResetType.Mounting`)**:
     - Group `'default'`: All body trackers (Ski Pose).
     - Group `'feet'`: Feet-only mounting calibration (Feet on ground).
     - Group `'fingers'`: Finger tracking mounting calibration.
- **Server Guard Enforcement**:
  - Disables buttons and displays warning tooltips if prerequisites are not met:
    - `serverGuards.canDoMounting === false` -> `"reset-error-mounting-need_full_reset"`
    - `serverGuards.canDoYawReset === false` -> `"reset-error-yaw-need_full_reset"`
    - Missing assigned trackers for feet/fingers groups -> `"reset-error-no_feet_tracker"`
- **Feedback & Animations**:
  - Visual circular/horizontal countdown timer (`ButtonProgress`).
  - Finished status animation (spin counter-clockwise or skiing icon).
  - Auditory feedback sounds (`handleResetSounds`) played according to user volume configuration.

---

## 5. Real-Time Telemetry Pipeline & Data Models

### 5.1 End-to-End WebSocket & FlatBuffers Telemetry Flow
```
┌─────────────────────────────────────────────────────────────┐
│                      SlimeVR Server                         │
│   (Java Core Engine, Tracker Drivers, Skeleton Solvers)     │
└──────────────────────────────┬──────────────────────────────┘
                               │ Binary WebSocket (Port 21110)
                               │ FlatBuffers: MessageBundle
                               ▼
┌─────────────────────────────────────────────────────────────┐
│           gui/src/hooks/websocket-api.ts (useProvideWebsocketApi)
│  1. Receives ArrayBuffer via WebSocket.onmessage            │
│  2. Deserializes MessageBundle using FlatBuffers ByteBuffer │
│  3. Dispatches CustomEvents on EventTarget listeners        │
└──────────────┬──────────────────────────────┬───────────────┘
               │ DataFeedMessage              │ RpcMessage
               ▼                              ▼
┌──────────────────────────────┐┌──────────────────────────────┐
│ gui/src/hooks/app.ts         ││ Component RPC Listeners      │
│ - DataFeedUpdate (index 0)   ││ - ResetResponse              │
│   -> setDatafeed(packet)     ││ - SettingsResponse           │
│ - DataFeedUpdate (index 1)   ││ - VRCConfigStateChangeResponse│
│   -> setBones(packet.bones)  ││ - TrackingChecklistResponse  │
└──────────────┬───────────────┘└──────────────────────────────┘
               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Jotai Reactive Atoms Layer                  │
│  datafeedAtom -> devicesAtom -> flatTrackersAtom            │
│                     ├─ assignedTrackersAtom                 │
│                     ├─ unassignedTrackersAtom               │
│                     └─ connectedIMUTrackersAtom             │
└──────────────┬──────────────────────────────────────────────┘
               ▼
┌─────────────────────────────────────────────────────────────┐
│                 React UI View Layer                         │
│  - Home.tsx (TrackerCard grid / TrackersTable rows)         │
│  - QuestDiagnosticsPill.tsx (Active counts & OSC status)    │
│  - Toolbar.tsx (Guarded Reset Buttons)                      │
│  - Sidebar.tsx (3D SkeletonVisualizerWidget, BVH recording) │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Key SolarXR FlatBuffers Schemas & TypeScript Data Models

#### Tracker Data Model (`solarxr_protocol.data_feed.tracker.TrackerData`)
```typescript
interface TrackerDataT {
  trackerId: TrackerIdT;              // { deviceId: { id: number }, trackerNum: number }
  info: TrackerInfoT | null;          // Static hardware & assignment metadata
  status: TrackerStatus;              // NONE | DISCONNECTED | OK | BUSY | ERROR | OCCLUDED | TIMED_OUT
  rotation: QuatT | null;             // Raw sensor fused orientation
  position: Vec3fT | null;            // 3D position in meters (synthetic / computed)
  rawAngularVelocity: Vec3fT | null;  // rad/s
  rawAcceleration: Vec3fT | null;     // m/s^2 (with gravity)
  linearAcceleration: Vec3fT | null;  // m/s^2 (gravity subtracted)
  temp: TemperatureT | null;          // Temperature in °C
  rotationReferenceAdjusted: QuatT;   // Orientation aligned to HMD VR Yaw (for skeleton posing)
  rotationIdentityAdjusted: QuatT;    // Orientation aligned to Identity (for IMU debugging)
  tps: number | null;                 // Data ticks per second
  rawMagneticVector: Vec3fT | null;   // mGauss
  stayAligned: StayAlignedTrackerT;   // Stay-Aligned drift calibration telemetry
}
```

#### Tracker Info Model (`solarxr_protocol.data_feed.tracker.TrackerInfo`)
```typescript
interface TrackerInfoT {
  imuType: ImuType;                   // MPU6050, BNO085, BMI270, LSM6DSV, ICM42688, etc.
  bodyPart: BodyPart;                 // HEAD, CHEST, WAIST, HIP, LEFT_FOOT, etc.
  pollRate: HzF32T;                   // Average sample rate
  mountingOrientation: QuatT | null;  // User configured mounting angle
  editable: boolean;                  // User editable flag
  isComputed: boolean;                // Solved position/rotation vs raw hardware
  isImu: boolean;                     // IMU hardware tracker
  displayName: string;                // Default hardware label
  customName: string | null;          // User assigned custom name
  allowDriftCompensation: boolean;    // Yaw drift compensation enabled
  mountingResetOrientation: QuatT;    // Active mounting reset offset
  isHmd: boolean;                     // Is Head Mounted Display
  magnetometer: MagnetometerStatus;   // DISABLED | ENABLED | NOT_SUPPORTED
  dataSupport: TrackerDataType;       // ROTATION | FLEX_RESISTANCE | FLEX_ANGLE
}
```

#### Device Telemetry & Hardware Status (`solarxr_protocol.datatypes.hardware_info`)
```typescript
interface DeviceDataT {
  id: DeviceIdT;
  customName: string | null;
  hardwareInfo: HardwareInfoT | null;
  hardwareStatus: HardwareStatusT | null;
  trackers: TrackerDataT[];
}

interface HardwareStatusT {
  errorStatus: FirmwareErrorCode | null;
  ping: number | null;                // Roundtrip latency in ms
  rssi: number | null;                // WiFi signal strength in dBm
  mcuTemp: number | null;             // MCU temperature in °C
  batteryVoltage: number | null;      // Volts (e.g. 4.12V)
  batteryPctEstimate: number | null;  // 0 - 100%
  batteryRuntimeEstimate: bigint;     // Microseconds of remaining runtime
  packetLoss: number | null;          // 0.0 - 1.0 fraction
  packetsLost: number | null;         // Lost packets count
  packetsReceived: number | null;     // Received packets count
}

interface HardwareInfoT {
  mcuId: McuType;                     // ESP8266, ESP32, ESP32_C3, NRF52, etc.
  displayName: string;
  model: string;
  manufacturer: string;               // e.g. "SlimeVR"
  hardwareRevision: string;
  firmwareVersion: string;            // e.g. "0.4.0"
  hardwareAddress: HardwareAddressT;  // MAC address
  ipAddress: Ipv4AddressT | null;     // IPv4 integer address
  boardType: string;                  // Board type string
  officialBoardType: BoardType;       // SLIMEVR, LOLIN_C3_MINI, OWOTRACK, etc.
  hardwareIdentifier: string;         // Unique MAC / USB ID
  networkProtocolVersion: number;
  firmwareDate: string;               // Build date (YYYY-MM-DD)
}
```

---

## 6. Architecture Synthesis & Redesign Recommendations

1. **State Isolation is Solid**: The Jotai atom structure cleanly decouples WebSocket ingestion from UI rendering. Redesigning views (Card View, Row View, Sidebars) will not destabilize backend synchronization.
2. **Component Granularity**:
   - `TrackerCard` and `TrackersTable` are clean consumers of `useTracker` and `useConfig`.
   - `QuestDiagnosticsPill` and `PresetSelector` in the subheader provide high informational value in minimal vertical space; they can be integrated smoothly into a macOS unified toolbar/header.
3. **Guardrails & Protocols**:
   - Outbound FlatBuffers packets (`AssignTrackerRequestT`, `ResetRequestT`, `ChangeSettingsRequestT`) must remain completely untouched to preserve 100% protocol fidelity.
   - Any layout restructuring should maintain access to `useReset` shortcuts, `useTrackingChecklist` warning badges, and `useTrackerPresets`.
