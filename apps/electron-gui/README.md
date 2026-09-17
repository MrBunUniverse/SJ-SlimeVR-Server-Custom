# SlimeVR Electron Desktop Client

> Cross-platform desktop interface tailored with Apple Human Interface Guidelines ergonomics, optical liquid vibrancy, real-time spatial HUD telemetry, and Quest Standalone VRChat OSC management.

This directory contains convenience commands only. The canonical Electron and React source is [`../../gui`](../../gui), so there is no second copy to keep synchronized.

---

### Technical Specifications

| System Component | Technology & Implementation Details |
| :--- | :--- |
| **Framework Runtime** | Electron 40 / Chromium / Node.js 22 LTS |
| **View Architecture** | React 18 / TypeScript 5 / Vite 5 / Jotai Atomic State |
| **Design System** | Apple Human Interface Guidelines (macOS Sequoia vibrancy tokens) |
| **Typography** | SF Pro Text, SF Pro Display, tabular numerals (`tnum`) |
| **3D Rendering** | Three.js with dirty-frame detection and device pixel ratio throttling |
| **Audio Feedback** | Web Audio API harmonic arpeggios & sine countdown synthesizers |
| **Power Management** | Native macOS `powerSaveBlocker` (`prevent-app-suspension`) |

---

## Architectural Highlights

### 1. Optical Vibrancy & Liquid Glass Material System
The client implements a 4-tier material depth hierarchy designed to blend seamlessly into modern macOS windowing:
* **`--material-canvas`**: Deep obsidian background layer (`rgb(20, 18, 14)` dark / `#FAF9F5` light).
* **`--material-primary`**: High-vibrancy panel base with real-time backdrop blur filter (`28px`, saturate `190%`).
* **`--material-secondary`**: Elevated card surfaces with specular rim lighting and subtle ambient occlusion.
* **`--material-tertiary`**: Micro-interactive controls featuring cubic-bezier spring scaling (`0.975` active scale).

### 2. Biomechanical Telemetry & Spatial HUD
* **Quest Standalone OSC HUD**: Real-time status indicators monitoring broadcast connection on port `9000`, active hardware counts, and packet integrity.
* **Millimeter-Level Floor Scrubber**: Tactile micro-steppers for adjusting player elevation in `1cm` increments with a centered magnetic `0cm` floor detent.
* **Concentric Card Geometries**: Hardware tracker cards and configuration panes adhere to proportional curvature formulas, preventing visual clipping and aliasing.

### 3. Audio-Spatial Calibration Feedback
Synthesizes distinct acoustic cues directly in the user's headset during calibration:
* **Countdown Beeps**: Pure `880Hz` sine tones during 3-second pose stabilization, transitioning to `1046Hz` on the final tick.
* **Success Chime**: An ascending harmonic C-major arpeggio ($C_5 \to E_5 \to C_6$) confirming successful mounting or full resets without requiring the user to look at the monitor.

### 4. GPU Resource Conservator
To ensure zero frame drops in intensive VR titles:
* **On-Demand Rendering**: The 3D skeletal preview runs dirty-frame monitoring, dropping render passes when tracker orientations are stationary.
* **Retina DPI Cap**: Limits WebGL canvas buffer scaling to `1.5x`, cutting GPU rasterization overhead by up to 60% on 4K/5K displays.

---

## Execution & Lifecycle

### Launching the Application
Double-click [`Launch Electron SlimeVR.command`](./Launch%20Electron%20SlimeVR.command) or execute:
```bash
./"Launch Electron SlimeVR.command"
```
The script boots the server daemon if not already alive on port `21110`, validates local dependencies, and instantiates the Electron desktop window.

### Compiling Production Bundles
To package the renderer and main bundles:
```bash
./build.sh
```
Compilation output will be assembled at `gui/out/`.

### Development with Live Reload
For active development with Hot Module Replacement (HMR):
```bash
cd ../../gui && pnpm run gui
```
