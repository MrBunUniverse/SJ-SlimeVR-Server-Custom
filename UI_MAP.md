# UI Component & Layout Map — SirJame SlimeVR

> **AI NAVIGATION INDEX**: Read this file first for visual UI work and start with the listed path.
> Paths and component names are navigation hints; line ranges may drift as the code evolves.
> **Maintenance**: Verify the actual symbol before editing and update this map when a component moves or its responsibility materially changes.

---

## HOW TO USE THIS MAP

1. Identify the UI element the user wants to change.
2. Find it in the table below and open the listed file near the suggested range.
3. Verify the current symbol. If the hint is stale, use a narrow `rg` query rather than scanning the whole repository.
4. Make the focused edit and update this map if the component moved.

---

## 1. Dashboard — Home Screen (`/`)

| UI Element                                         | File                                               | Lines                | What's There                                                                                         |
| :------------------------------------------------- | :------------------------------------------------- | :------------------- | :--------------------------------------------------------------------------------------------------- |
| **Home page layout shell**                         | `gui/src/components/home/Home.tsx`                 | L1–L417              | Three-zone tracking toolbar, view mode toggle (`default`/`table`), 3D drawer toggle, Quest HUD embed |
| ↳ Collapsible preset & active tracker pill toolbar | `gui/src/components/home/Home.tsx`                 | L158–L255            | Collapsible chevron toggle, compact pill badge, and preset/diagnostics pills                         |
| **Grid card ↔ Table switcher buttons**             | `gui/src/components/home/Home.tsx`                 | L262–L330            | Segmented Card/Table icons and 3D Skeleton preview toggle                                            |
| **Tracker Grid Card** (the orange card)            | `gui/src/components/home/HomeEmptyState.tsx`       | L20–L285             | `ClaudeTrackerWindowCard` — entire card component                                                    |
| ↳ Battery tag logic (top-right `%` / `0%`)         | `gui/src/components/home/HomeEmptyState.tsx`       | L72–L80              | `tag` variable: offline→`0%`, connected→`XX%`, voltage fallback                                      |
| ↳ Subtitle description items                       | `gui/src/components/home/HomeEmptyState.tsx`       | L82–L91              | `descItems[]` — voltage + "Connected · Steady" or "Sensor offline"                                   |
| ↳ 3-ball battery indicator (macOS traffic lights)  | `gui/src/components/home/HomeEmptyState.tsx`       | L93–L131             | `ball1/ball2/ball3` color logic: grey=offline, green/yellow/red by %                                 |
| ↳ 3D realtime IMU preview toggle & canvas          | `gui/src/components/home/HomeEmptyState.tsx`       | L203–L244            | 3D cube button + `CardIMUVisualizer` render                                                          |
| ↳ Card header banner (wave + icon area)            | `gui/src/components/home/HomeEmptyState.tsx`       | L144–L248            | `h-30 sm:h-32` banner, SVG contour waves, 3D render + body icon                                      |
| ↳ Body part icon in card                           | `gui/src/components/home/HomeEmptyState.tsx`       | L220, L241           | `<BodyPartIcon width={46} />` (centered) or `width={34}` (when 3D on)                                |
| ↳ Motion glow / scale animation                    | `gui/src/components/home/HomeEmptyState.tsx`       | L216–L240            | `isMoving` → `scale-115 drop-shadow` terracotta glow                                                 |
| ↳ Card footer: tracker name + status               | `gui/src/components/home/HomeEmptyState.tsx`       | L250–L285            | Tracker name `<h3>`, status label, `descItems` subtitle                                              |
| **Dashboard controls bar**                         | `gui/src/components/home/HomeEmptyState.tsx`       | L765–L845            | "Trackers" heading, DEMO MODE pill, active count, guide toggle                                       |
| **Empty state / 0 trackers**                       | `gui/src/components/home/HomeEmptyState.tsx`       | L860–L1015           | "Waiting for Tracker" title, description, setup cards grid                                           |
| ↳ Empty state title text                           | `gui/src/components/home/HomeEmptyState.tsx`       | L989                 | `"Waiting for Tracker"` — change string here                                                         |
| ↳ Empty state description text                     | `gui/src/components/home/HomeEmptyState.tsx`       | L992–L995            | `"Power on your trackers nearby to connect."`                                                        |
| **Welcome hero banner** (collapsible)              | `gui/src/components/home/HomeEmptyState.tsx`       | L310–L510, L715–L790 | "Welcome to SirJameSlimeVR" terminal typing, breathing logo, CTA buttons                             |
| **Presets dropdown**                               | `gui/src/components/home/PresetSelector.tsx`       | L1–L140              | Active preset pill, star indicator, quick preset switcher modal                                      |
| **Quest OSC diagnostics card**                     | `gui/src/components/home/QuestDiagnosticsCard.tsx` | L1–L450              | IP badge, OSC port, headset battery, streaming stats, Chatbox HUD                                    |
| **Quest diagnostics pill** (compact)               | `gui/src/components/home/QuestDiagnosticsPill.tsx` | L1–L120              | Compact inline pill shown in toolbar area                                                            |
| **Reset button** (Yaw/Full/Mount)                  | `gui/src/components/home/ResetButton.tsx`          | L1–L85               | Countdown reset button component                                                                     |
| **Reset shortcuts bar**                            | `gui/src/components/Toolbar.tsx`                   | L40–L120             | Yaw, Full, Mounting reset countdown buttons                                                          |

---

## 2. Tracker Table / List View

| UI Element                                          | File                                                             | Lines     | What's There                                                                                                                  |
| :-------------------------------------------------- | :--------------------------------------------------------------- | :-------- | :---------------------------------------------------------------------------------------------------------------------------- |
| **Full table component**                            | `gui/src/components/tracker/TrackersTable.tsx`                   | L1–L390   | Entire list/table view                                                                                                        |
| **Tracker name cell** (icon + name + status pill)   | `gui/src/components/tracker/TrackersTable.tsx`                   | L39–L78   | `TrackerNameCell`: coral body icon panel + serif name + inline `TrackerStatus`                                                |
| ↳ Body icon size in table                           | `gui/src/components/tracker/TrackersTable.tsx`                   | L67       | `<BodyPartIcon bodyPart={...} width={30} />`                                                                                  |
| **Column header row**                               | `gui/src/components/tracker/TrackersTable.tsx`                   | L105–L128 | `Header` component — column label Typography                                                                                  |
| **Table cell wrapper** (per cell styling)           | `gui/src/components/tracker/TrackersTable.tsx`                   | L130–L162 | `Cell`: transparent padded telemetry cell; row owns surface and outline                                                       |
| **Full row** (all cells + grid layout)              | `gui/src/components/tracker/TrackersTable.tsx`                   | L166–L302 | `Row`: keyboard-accessible CSS grid, continuous surface and motion outline at velocity >0.18; styling in `TrackersTable.scss` |
| **Table outer container**                           | `gui/src/components/tracker/TrackersTable.tsx`                   | L304–L390 | `TrackersTable`: `w-full overflow-x-auto py-2 px-2` wrapper                                                                   |
| **Tracker status pill** (colored dot + label)       | `gui/src/components/tracker/TrackerStatus.tsx`                   | L27–L46   | `glass-pill` class, dot color per status, localized label                                                                     |
| ↳ Status dot colors                                 | `gui/src/components/tracker/TrackerStatus.tsx`                   | L17–L25   | `statusClassMap`: green=OK, grey=DISCONNECTED, yellow=WARNING                                                                 |
| **Battery display** (icon + % / runtime)            | `gui/src/components/tracker/TrackerBattery.tsx`                  | L7–L85    | `BatteryIcon` + pct/voltage/runtime text, tooltip                                                                             |
| **Tracker settings page**                           | `gui/src/components/tracker/TrackerSettings.tsx`                 | L1–L840   | Full tracker detail: name, body assignment, rotation, adaptive drift profile, IMU viz                                         |
| ↳ Collapsible Firmware Version & Manufacturer cards | `gui/src/components/tracker/TrackerSettings.tsx`                 | L315–L630 | Collapsible sections with chevron toggles for firmware & hardware info                                                        |
| ↳ Body assignment menu inside settings              | `gui/src/components/tracker/SingleTrackerBodyAssignmentMenu.tsx` | L1–L100   | Dropdown to assign body part to tracker                                                                                       |
| **Old-style tracker card** (non-grid)               | `gui/src/components/tracker/TrackerCard.tsx`                     | L30–L80   | `fill-background-10` icon + name + status, used in onboarding                                                                 |
| ↳ Icon in old TrackerCard                           | `gui/src/components/tracker/TrackerCard.tsx`                     | L44       | `<BodyPartIcon bodyPart={...} />` — default width 24                                                                          |

---

## 3. Body Part Icons

| Icon                          | File                                                 | ViewBox         | Notes                                                                 |
| :---------------------------- | :--------------------------------------------------- | :-------------- | :-------------------------------------------------------------------- |
| **Icon wrapper / background** | `gui/src/components/commons/BodyPartIcon.tsx`        | —               | Outer `<svg>` wrapper; purple bg rect REMOVED (see .bak for original) |
| ↳ Icon size in grid card      | `gui/src/components/home/HomeEmptyState.tsx`         | L216            | `width={46}` — change this ONE number to resize all grid icons        |
| **Chest**                     | `gui/src/components/commons/icon/ChestIcon.tsx`      | `0 0 50 50`     | Full torso shape                                                      |
| **Upper Chest**               | `gui/src/components/commons/icon/UpperChestIcon.tsx` | `0 0 50 50`     | Same shape as chest (upper portion)                                   |
| **Waist / Hip (Waist)**       | `gui/src/components/commons/icon/WaistIcon.tsx`      | `0 0 72 72`     | Pelvis + arrow indicators                                             |
| **Hip**                       | `gui/src/components/commons/icon/HipIcon.tsx`        | `0 0 72 72`     | Same as Waist visually                                                |
| **Upper Leg**                 | `gui/src/components/commons/icon/UpperLegIcon.tsx`   | `11 0 33 52`    | Tight viewBox — leg fills frame                                       |
| **Ankle / Lower Leg**         | `gui/src/components/commons/icon/AnkleIcon.tsx`      | `8 5 12 18`     | Tight viewBox — shin fills frame                                      |
| **Foot**                      | `gui/src/components/commons/icon/FootIcon.tsx`       | `8.5 1.5 13 25` | Tight viewBox — foot fills frame                                      |
| **Neck**                      | `gui/src/components/commons/icon/NeckIcon.tsx`       | `0 0 50 50`     | Neck/collar shape                                                     |
| **Shoulder**                  | `gui/src/components/commons/icon/ShoulderIcon.tsx`   | `0 0 50 50`     | Shoulder pad shape                                                    |
| **Upper Arm**                 | `gui/src/components/commons/icon/UpperArmIcon.tsx`   | `0 0 50 50`     | Upper arm silhouette                                                  |
| **Lower Arm**                 | `gui/src/components/commons/icon/LowerArmIcon.tsx`   | `0 0 50 50`     | Forearm + hand silhouette                                             |
| **Controller / Hand**         | `gui/src/components/commons/icon/ControllerIcon.tsx` | `0 0 21 25.078` | VR controller shape                                                   |
| **Head / Headset**            | `gui/src/components/commons/icon/HeadsetIcon.tsx`    | `0 0 640 512`   | VR headset with 0.75 scale transform                                  |
| **Fingers**                   | `gui/src/components/commons/icon/FingersIcon.tsx`    | `0 0 93.49 130` | Hand with spread fingers                                              |
| **Paw** (owo locale only)     | `gui/src/components/commons/icon/PawIcon.tsx`        | `0 0 512 512`   | Only shown in `en-x-owo` locale                                       |
| **Unassigned (SlimeVR logo)** | `gui/src/components/commons/icon/SlimeVRIcon.tsx`    | `0 0 380 380`   | Default icon when `BodyPart.NONE`                                     |
| **Icon → body part mapping**  | `gui/src/components/commons/BodyPartIcon.tsx`        | L21–L128        | `mapPart` record — maps `BodyPart` enum → icon component              |

---

## 4. Navigation & App Chrome

| UI Element                           | File                                                      | Lines       | What's There                                                                                                                                                                        |
| :----------------------------------- | :-------------------------------------------------------- | :---------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Top bar / title bar**              | `gui/src/components/TopBar.tsx`                           | L1666–L2010 | Window traffic lights, collapsible telemetry & controls, brand logo, update pill                                                                                                    |
| **Quest IP pill** (editable popover) | `gui/src/components/TopBar.tsx`                           | L46–L115    | IP input popover, clickable pill                                                                                                                                                    |
| **VRChat Chatbox tab & popover**     | `gui/src/components/TopBar.tsx`                           | L306–L1475  | Broadcast HUD popover with Voice/Sticky/Music/BPM tablist, keyboard navigation, in-game text messenger, Apple Music live now playing, Chat-Only mode toggle, auto battery broadcast |
| **Settings dropdown**                | `gui/src/components/TopBar.tsx`                           | L1374–L1515 | Popover menu for settings, checklist, and wizards                                                                                                                                   |
| **Top bar utility navigation**       | `gui/src/components/TopBar.tsx`                           | L1650–L1660 | `TopBarNav`: keeps the always-available VRChat Chatbox utility; primary app navigation lives in the floating dock                                                                   |
| **Server status indicator**          | `gui/src/components/TopBar.tsx`                           | L1520–L1620 | Connected/disconnected server status pill styling                                                                                                                                   |
| **Floating dock nav**                | `gui/src/components/Navbar.tsx`                           | L1–L112     | Four task-level destinations: Home, Remote, Setup Wizard, Settings; fixed above content on desktop and mobile                                                                       |
| **Main layout shell**                | `gui/src/components/MainLayout.tsx`                       | L1–L220     | App shell: sidebar + content area + 3D drawer + draggable skeleton resizer handle                                                                                                   |
| **3D skeleton drawer**               | `gui/src/components/Sidebar.tsx`                          | L1–L310     | Collapsible right drawer: skeleton viz, height, BVH recording, 360° auto-orbit camera                                                                                               |
| **3D skeleton WebGL canvas**         | `gui/src/components/widgets/SkeletonVisualizerWidget.tsx` | L1–L530     | Three.js skeleton renderer, floor grid, auto-orbit camera controls                                                                                                                  |
| **IMU orientation visualizer**       | `gui/src/components/widgets/IMUVisualizerWidget.tsx`      | L1–L620     | Three.js IMU rotation gizmo & collapsible Tracking data section                                                                                                                     |
| **Serial detection modal**           | `gui/src/components/SerialDetectionModal.tsx`             | L1–L150     | Auto-detected serial tracker popup                                                                                                                                                  |
| **Unknown device modal**             | `gui/src/components/UnknownDeviceModal.tsx`               | L1–L90      | Popup for unrecognized hardware                                                                                                                                                     |
| **Version update modal**             | `gui/src/components/VersionUpdateModal.tsx`               | L1–L130     | In-app update prompt                                                                                                                                                                |
| **Trackers still on modal**          | `gui/src/components/TrackersStillOnModal.tsx`             | L1–L50      | Warning when closing with active trackers                                                                                                                                           |
| **Tray or exit modal**               | `gui/src/components/TrayOrExitModal.tsx`                  | L1–L70      | "Minimize to tray?" dialog on close                                                                                                                                                 |
| **Pause tracking button**            | `gui/src/components/TrackingPauseButton.tsx`              | L1–L50      | Pause/resume all tracker streaming                                                                                                                                                  |
| **BVH record button**                | `gui/src/components/BVHButton.tsx`                        | L1–L60      | Start/stop BVH motion capture recording                                                                                                                                             |

---

## 5. Settings Suite (`/settings/...`)

| UI Element                          | File                                                                    | Lines      | What's There                                                                  |
| :---------------------------------- | :---------------------------------------------------------------------- | :--------- | :---------------------------------------------------------------------------- |
| **Settings layout shell**           | `gui/src/components/settings/SettingsLayout.tsx`                        | L1–L130    | Settings page wrapper with sidebar                                            |
| **Settings sidebar nav**            | `gui/src/components/settings/SettingsSidebar.tsx`                       | L390–L550  | Category groups: General, Interface, OSC, Serial, Utilities                   |
| **General settings page**           | `gui/src/components/settings/pages/GeneralSettings.tsx`                 | L1–L1592   | SteamVR, Stay Aligned, FK, filtering, proportions, telemetry — very long file |
| ↳ Stay Aligned section              | `gui/src/components/settings/pages/GeneralSettings.tsx`                 | ~L600–L750 | Stay Aligned pose toggle + info                                               |
| ↳ FK / leg twitch compensation      | `gui/src/components/settings/pages/GeneralSettings.tsx`                 | ~L800–L950 | Drift correction sliders                                                      |
| **Interface & appearance settings** | `gui/src/components/settings/pages/InterfaceSettings.tsx`               | L1–L600    | Theme, locale, notifications, window behavior                                 |
| **Home screen appearance settings** | `gui/src/components/settings/pages/HomeScreenSettings.tsx`              | L1–L180    | Card density, default layout toggles                                          |
| **VRChat OSC settings**             | `gui/src/components/settings/pages/VRCOSCSettings.tsx`                  | L1–L400    | VRC OSC port, address, parameter toggles, Chatbox battery HUD                 |
| **OSC router settings**             | `gui/src/components/settings/pages/OSCRouterSettings.tsx`               | L1–L200    | OSC routing configuration                                                     |
| **VMC settings**                    | `gui/src/components/settings/pages/VMCSettings.tsx`                     | L1–L400    | Virtual Motion Capture settings                                               |
| **Serial console**                  | `gui/src/components/settings/pages/Serial.tsx`                          | L1–L500    | Serial monitor, baud rate, auto-connect, firmware commands                    |
| **Advanced settings**               | `gui/src/components/settings/pages/AdvancedSettings.tsx`                | L1–L280    | Low-level server variables, socket bindings                                   |
| **Stay Aligned pose modal**         | `gui/src/components/settings/pages/components/StayAlignedPoseModal.tsx` | L1–L120    | Pose capture modal for Stay Aligned                                           |
| **Stay Aligned settings panel**     | `gui/src/components/settings/pages/components/StayAlignedSettings.tsx`  | L1–L360    | Stay Aligned configuration UI                                                 |
| **Magnetometer toggle**             | `gui/src/components/settings/pages/MagnetometerToggleSetting.tsx`       | L1–L130    | Toggle for mag sensor calibration mode                                        |
| **Settings reset modal**            | `gui/src/components/settings/SettingsResetModal.tsx`                    | L1–L60     | "Reset all settings?" confirmation                                            |

---

## 6. Remote & Quest Audio/Mic Streaming Suite (`/remote`)

| UI Element                                   | File                                                         | Lines         | What's There                                                                                                               |
| :------------------------------------------- | :----------------------------------------------------------- | :------------ | :------------------------------------------------------------------------------------------------------------------------- |
| **Remote streaming dashboard**               | `gui/src/components/remote/RemotePage.tsx`                   | L1–end        | Header, demo mode, streaming active pill, prerequisites alert, ADB WiFi bar, monitor, audio cards, and Quest mirror studio |
| ↳ Headset selector & wireless ADB connection | `gui/src/components/remote/RemotePage.tsx`                   | L629–L773     | USB/WiFi device list, IP address input, wireless ADB connect button                                                        |
| ↳ Audio Demo & Channel Monitor               | `gui/src/components/remote/RemotePage.tsx`                   | L775–L1007    | Looping Left/Right/Mono acoustic pings, real-time channel HUD, volume & pattern controls                                   |
| ↳ Quest Game Audio stream card               | `gui/src/components/remote/RemotePage.tsx`                   | L1012–L1250   | `--audio-source=output`, Opus/AAC/Raw codec & buffer selectors, Game Volume slider, start/stop toggle                      |
| ↳ Quest Headset Mic stream card              | `gui/src/components/remote/RemotePage.tsx`                   | L1252–L1490   | `--audio-source=mic`, mic codec & buffer selectors, Mic Gain slider, start/stop toggle                                     |
| ↳ Quest mirror studio                        | `gui/src/components/remote/RemotePage.tsx`                   | Near page end | Starts/stops the dedicated single-eye OBS mirror or the combined video/audio/mic session and shows capture status          |
| **Quest capture settings**                   | `gui/src/components/settings/pages/QuestCaptureSettings.tsx` | L1–end        | Presets, eye/aspect crop, codec, resolution, FPS, bitrate, buffers, audio inclusion, and mirror-window controls            |
| **Quest capture settings hook**              | `gui/src/hooks/quest-capture.ts`                             | L1–end        | Versioned persisted settings and capture profile defaults                                                                  |
| **Quest capture process manager**            | `gui/electron/main/quest-capture.ts`                         | L1–end        | Validated scrcpy video process, crop calculation, capability discovery, studio orchestration, status, and cleanup          |
| **Remote tab icon**                          | `gui/src/components/commons/icon/RemoteIcon.tsx`             | L1–L30        | Broadcast/Cast icon used in TopBar & Navbar                                                                                |

---

## 7. Onboarding Wizard (`/onboarding/...`)

| UI Element                               | File                                                                            | Lines   | What's There                                                                        |
| :--------------------------------------- | :------------------------------------------------------------------------------ | :------ | :---------------------------------------------------------------------------------- |
| **Onboarding layout**                    | `gui/src/components/onboarding/OnboardingLayout.tsx`                            | L1–L50  | Wizard shell + progress bar                                                         |
| **Onboarding splash / home**             | `gui/src/components/onboarding/pages/Home.tsx`                                  | L1–L185 | "Get Started" intro card with terminal typing, click-to-skip, & entrance motion     |
| **Tracker model setup**                  | `gui/src/components/onboarding/pages/quiz/SlimeSetQuestion.tsx`                 | L1–L330 | Tracker model selection card with terminal typing, click-to-skip, & entrance motion |
| **WiFi credentials page**                | `gui/src/components/onboarding/pages/WifiCreds.tsx`                             | L1–L107 | 2-col layout: Dongle card + WiFi form                                               |
| ↳ Dongle card (left column)              | `gui/src/components/onboarding/pages/Dongle.tsx`                                | L10–L46 | USB icon, dongle description, WIP warning box                                       |
| ↳ Warning box text overflow fix          | `gui/src/components/onboarding/pages/Dongle.tsx`                                | L14     | `min-w-0 overflow-hidden` — prevents overflow onto WiFi card                        |
| **Connect tracker step**                 | `gui/src/components/onboarding/pages/ConnectTracker.tsx`                        | L1–L400 | Power-on animation, connection progress                                             |
| **Body assignment page**                 | `gui/src/components/onboarding/pages/trackers-assign/TrackerAssignment.tsx`     | L1–L380 | Full skeleton assignment UI                                                         |
| ↳ Tracker selection menu                 | `gui/src/components/onboarding/pages/trackers-assign/TrackerSelectionMenu.tsx`  | L1–L130 | Popup to pick which tracker for a slot                                              |
| **Body assignment interactive skeleton** | `gui/src/components/onboarding/BodyAssignment.tsx`                              | L1–L450 | Clickable body SVG for slot assignment                                              |
| **Mounting calibration**                 | `gui/src/components/onboarding/pages/mounting/MountingChoose.tsx`               | L1–L170 | Auto vs manual mounting choice                                                      |
| ↳ Auto mounting flow                     | `gui/src/components/onboarding/pages/mounting/AutomaticMounting.tsx`            | L1–L60  | Ski pose auto-mount                                                                 |
| ↳ Manual mounting                        | `gui/src/components/onboarding/pages/mounting/ManualMounting.tsx`               | L1–L280 | Per-tracker roll/pitch dials                                                        |
| ↳ Mounting selection menu                | `gui/src/components/onboarding/pages/mounting/MountingSelectionMenu.tsx`        | L1–L400 | All direction options with body icon previews                                       |
| **Body proportions wizard**              | `gui/src/components/onboarding/pages/body-proportions/BodyProportions.tsx`      | L1–L300 | Auto vs manual proportions entry                                                    |
| ↳ Automatic proportions                  | `gui/src/components/onboarding/pages/body-proportions/AutomaticProportions.tsx` | L1–L80  | Autobone calibration step                                                           |
| ↳ Manual proportions sliders             | `gui/src/components/onboarding/pages/body-proportions/ManualProportions.tsx`    | L1–L500 | Per-limb length sliders                                                             |
| ↳ Scaled proportions                     | `gui/src/components/onboarding/pages/body-proportions/ScaledProportions.tsx`    | L1–L550 | Height-scaled proportions UI                                                        |
| ↳ Height input step                      | `gui/src/components/onboarding/pages/body-proportions/HeightInput.tsx`          | L1–L260 | Height entry with unit toggle (cm/ft)                                               |
| **Reset tutorial page**                  | `gui/src/components/onboarding/pages/ResetTutorial.tsx`                         | L1–L200 | Yaw/mounting reset pose instructions                                                |
| **Skip setup modal**                     | `gui/src/components/onboarding/SkipSetupWarningModal.tsx`                       | L1–L150 | Warning when skipping onboarding                                                    |
| **Udev rules modal** (Linux)             | `gui/src/components/onboarding/UdevRulesModal.tsx`                              | L1–L130 | Linux serial permissions helper                                                     |
| **Neck warning modal**                   | `gui/src/components/onboarding/NeckWarningModal.tsx`                            | L1–L60  | Safety warning for neck tracker assignment                                          |

---

## 8. Shared UI Primitives (Commons)

| Component                                  | File                                              | Lines   | What's There                                                                       |
| :----------------------------------------- | :------------------------------------------------ | :------ | :--------------------------------------------------------------------------------- |
| **Button**                                 | `gui/src/components/commons/Button.tsx`           | L1–L140 | `variant`: `primary`, `secondary`, `tertiary`, icon buttons                        |
| **Typography**                             | `gui/src/components/commons/Typography.tsx`       | L1–L90  | Text variants: `main-title`, `bold`, `standard`, colors                            |
| **Input**                                  | `gui/src/components/commons/Input.tsx`            | L1–L155 | Controlled text/password input with label, validation                              |
| **Dropdown**                               | `gui/src/components/commons/Dropdown.tsx`         | L1–L380 | Full dropdown with search, multi-select                                            |
| **Checkbox**                               | `gui/src/components/commons/Checkbox.tsx`         | L1–L150 | Controlled checkbox with label                                                     |
| **Range slider**                           | `gui/src/components/commons/Range.tsx`            | L1–L65  | Horizontal range input                                                             |
| **Number selector**                        | `gui/src/components/commons/NumberSelector.tsx`   | L1–L120 | +/- stepper for numeric values                                                     |
| **Tip box** (info/bulb)                    | `gui/src/components/commons/TipBox.tsx`           | L6–L38  | Blue/neutral info box with lightbulb icon                                          |
| **Warning box** (orange alert)             | `gui/src/components/commons/TipBox.tsx`           | L44–L89 | Orange warning box with triangle icon, `whitespace-pre-wrap` text                  |
| **Tooltip**                                | `gui/src/components/commons/Tooltip.tsx`          | L1–L450 | Hover tooltip, `preferredDirection` prop                                           |
| **Modal base**                             | `gui/src/components/commons/BaseModal.tsx`        | L1–L40  | Backdrop + centered card shell                                                     |
| **Progress bar**                           | `gui/src/components/commons/ProgressBar.tsx`      | L1–L50  | Animated progress fill                                                             |
| **Vertical stepper**                       | `gui/src/components/commons/VerticalStepper.tsx`  | L1–L120 | Step-by-step wizard indicator                                                      |
| **Theme selector**                         | `gui/src/components/commons/ThemeSelector.tsx`    | L1–L55  | Theme selector including the reference-inspired `macos` navy/blue-gray/amber theme |
| **Body display** (skeleton overview)       | `gui/src/components/commons/BodyDisplay.tsx`      | L1–L160 | Full-body assignment overview SVG                                                  |
| **Body interactions** (clickable skeleton) | `gui/src/components/commons/BodyInteractions.tsx` | L1–L250 | Hover/click zones on body SVG                                                      |

---

## 9. Tracking Checklist & VRC Warnings

| UI Element                         | File                                                               | Lines   | What's There                                         |
| :--------------------------------- | :----------------------------------------------------------------- | :------ | :--------------------------------------------------- |
| **Tracking checklist** (step list) | `gui/src/components/tracking-checklist/TrackingChecklist.tsx`      | L1–L700 | All preflight check steps: trackers, server, SteamVR |
| **Tracking checklist modal**       | `gui/src/components/tracking-checklist/TrackingChecklistModal.tsx` | L1–L35  | Modal wrapper for checklist                          |
| **VRC warnings page**              | `gui/src/components/vrc/VRCWarningsPage.tsx`                       | L1–L320 | VRChat OSC/avatar compatibility warnings             |

---

## 10. Firmware Tool (`/settings/firmware-tool`)

| UI Element                     | File                                                | Lines   | What's There                                 |
| :----------------------------- | :-------------------------------------------------- | :------ | :------------------------------------------- |
| **Firmware tool main page**    | `gui/src/components/firmware-tool/FirmwareTool.tsx` | L1–L160 | Board selection, firmware version picker     |
| **Device card** (detected MCU) | `gui/src/components/firmware-tool/DeviceCard.tsx`   | L1–L130 | Connected device info card with flash button |

---

## 11. Quest Remote Page (`/remote`)

| UI Element                           | File                                       | Lines         | What's There                                                                          |
| :----------------------------------- | :----------------------------------------- | :------------ | :------------------------------------------------------------------------------------ |
| **Remote page shell & header**       | `gui/src/components/remote/RemotePage.tsx` | L380–L465     | Header card, serif title, stream status pill, scrcpy Ready badge, Demo Mode toggle    |
| **Prerequisite tool alerts**         | `gui/src/components/remote/RemotePage.tsx` | L470–L515     | TipBox for missing ADB or scrcpy with automatic install button                        |
| **Connected headsets & ADB connect** | `gui/src/components/remote/RemotePage.tsx` | L520–L640     | Mock-window banner, device list, USB/Wi-Fi connection controls                        |
| **Audio Demo & Channel Monitor**     | `gui/src/components/remote/RemotePage.tsx` | L640–L870     | Real-time L/R/Mono ping HUD, pattern switcher, volume slider, Loopback quick tip      |
| **Game audio stream card**           | `gui/src/components/remote/RemotePage.tsx` | L870–L1060    | Mock-window banner with contour waves, speaker icon, metric tiles, Game Volume slider |
| **Microphone stream card**           | `gui/src/components/remote/RemotePage.tsx` | L1065–L1250   | Mock-window banner with contour waves, mic icon, metric tiles, Mic Gain slider        |
| **Quest mirror studio**              | `gui/src/components/remote/RemotePage.tsx` | Near page end | Functional single-eye mirror and combined video/audio/mic controls                    |

---

## 12. Design System & Global Tokens

| Token / Area                     | File                     | What's There                                                                                                                                                                                                            |
| :------------------------------- | :----------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **Global CSS + Tailwind tokens** | `gui/src/index.scss`     | `--material-canvas`, `--material-primary`, `.glass-panel`, `.glass-popover`, `.glass-pill`; `macos` uses a deepened navy derived from `#1A3263`, dark `#547792` blue-gray surfaces, `#E8E2DB` text, and `#FAB95B` amber |
| **Tailwind color palette**       | `gui/tailwind.config.ts` | Semantic `background-*` and `accent-background-*` scales, with `macos` anchored to `#FAB95B`                                                                                                                            |
| **App routing**                  | `gui/src/App.tsx`        | L1–L220                                                                                                                                                                                                                 | All route definitions: home, remote, onboarding, settings, tracker detail |

---

## 13. State / Data Hooks (for logic changes)

| Hook                  | File                             | What It Does                             |
| :-------------------- | :------------------------------- | :--------------------------------------- |
| `useTracker`          | `gui/src/hooks/tracker.ts`       | Tracker name, velocity, status helpers   |
| `useAppContext`       | `gui/src/hooks/app.ts`           | Global app state: trackers list, devices |
| `useConfig`           | `gui/src/hooks/config.ts`        | User config (theme, debug, etc.)         |
| `useWebsocketAPI`     | `gui/src/hooks/websocket-api.ts` | Send RPC messages to server              |
| `useOnboarding`       | `gui/src/hooks/onboarding.ts`    | Wizard state, progress, slimeSet type    |
| `usePresets`          | `gui/src/hooks/presets.ts`       | Tracker preset load/save/switch          |
| `useReset`            | `gui/src/hooks/reset.ts`         | Yaw/Full/Mounting reset countdown logic  |
| `demo-trackers store` | `gui/src/store/demo-trackers.ts` | Simulated tracker data for demo mode     |
| `app-store`           | `gui/src/store/app-store.ts`     | Jotai atoms: ignored trackers, etc.      |

---

## 14. QUICK-REFERENCE CHEAT SHEET

> For any AI: match the user's request to one row → go directly to that file + line. Zero searching needed.

| What the user wants to change               | Go directly to                                                 |
| :------------------------------------------ | :------------------------------------------------------------- |
| Grid card appearance (colors, layout, size) | `HomeEmptyState.tsx` L19–L260                                  |
| **Grid card icon size**                     | `HomeEmptyState.tsx` **L216** (one number: `width={46}`)       |
| Card header banner height                   | `HomeEmptyState.tsx` L142 (`h-30 sm:h-32`)                     |
| Battery tag (top-right %)                   | `HomeEmptyState.tsx` L71–L79                                   |
| 3-ball battery indicator colors             | `HomeEmptyState.tsx` L92–L130                                  |
| Empty state title / description             | `HomeEmptyState.tsx` L838–L844                                 |
| Any body part icon shape                    | `commons/icon/<PartName>Icon.tsx` → change `viewBox` attribute |
| All icons simultaneously                    | `BodyPartIcon.tsx` L138–L143 (wrapper SVG + size)              |
| Table/list row styling                      | `TrackersTable.tsx` L130–L162 (Cell component)                 |
| Table name cell (icon + name)               | `TrackersTable.tsx` L39–L78                                    |
| Status pill colors                          | `TrackerStatus.tsx` L17–L25                                    |
| Warning box text wrapping                   | `TipBox.tsx` L81–L89                                           |
| Dongle card overflow                        | `Dongle.tsx` L14                                               |
| WiFi + Dongle page layout                   | `WifiCreds.tsx` L17–L103                                       |
| Tailwind theme colors                       | `tailwind.config.ts`                                           |
| Glass tokens / vibrancy effects             | `index.scss`                                                   |
| Floating dock navigation                    | `Navbar.tsx` L1–L112                                           |
| Top bar / title bar                         | `TopBar.tsx` L1606–L1950 (Chatbox L340–L1250)                  |
| Settings sidebar categories                 | `SettingsSidebar.tsx` L390–L535                                |
| Onboarding flow pages                       | `onboarding/pages/<PageName>.tsx`                              |
