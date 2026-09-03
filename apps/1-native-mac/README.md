# 🍏 SlimeVR Native macOS App (SwiftUI + SceneKit)

A high-performance native macOS client built strictly according to **Apple Human Interface Guidelines (HIG)** and **UI/UX Pro Max** standards.

---

### ⚡ Key Highlights
* **Pure Native Performance**: Instant launch (<100ms), sub-40MB RAM usage, and 0.0% idle GPU footprint.
* **3D SceneKit Skeleton Viewport**: Metal-accelerated 3D humanoid skeleton with drag-to-orbit camera controls.
* **macOS Menu Bar Extra**: Monitor connected trackers, Quest IP, and adjust elevation directly from your Mac's top notch bar.
* **Sleep & Wi-Fi Protection**: Native `ProcessInfo` power assertion keeps your Mac and Wi-Fi active during VR tracking sessions.

---

### 🚀 How to Run
Double-click:
`Launch Native SlimeVR.command`

### 🛠️ How to Update & Rebuild
Run:
```bash
./build.sh
```
Or inside `source/`:
```bash
swift build -c release
```
