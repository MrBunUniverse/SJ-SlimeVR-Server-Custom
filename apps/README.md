# 📁 SlimeVR Applications Index

This directory provides dedicated subfolders for the two distinct frontend clients of SlimeVR. Both connect to the local high-performance Kotlin tracking server daemon.

---

### 📂 Subfolders

```
apps/
├── 1-native-mac/         # 🍏 100% Native macOS Client (SwiftUI + SceneKit + MenuBarExtra)
│   ├── source -> ../../mac/SlimeVRNative
│   ├── Launch Native SlimeVR.command
│   ├── build.sh
│   └── README.md
│
└── 2-electron-gui/       # 🌐 Original Electron + React Web GUI
    ├── source -> ../../gui
    ├── Launch Electron SlimeVR.command
    ├── build.sh
    └── README.md
```

---

### 🚀 Quick Launch

* **To run Native macOS App**:
  Double-click `apps/1-native-mac/Launch Native SlimeVR.command` (or from root: `Launch Native SlimeVR.command`)

* **To run Electron Web App**:
  Double-click `apps/2-electron-gui/Launch Electron SlimeVR.command` (or from root: `Launch Electron SlimeVR.command`)

---

### 🛠️ Quick Update / Rebuild

* **Update Native macOS App**:
  ```bash
  cd apps/1-native-mac && ./build.sh
  ```

* **Update Electron Web App**:
  ```bash
  cd apps/2-electron-gui && ./build.sh
  ```
