# Applications & Client Interfaces

> Workspace registry and execution hub for SlimeVR frontend clients, facilitating communication with the background Kotlin tracking daemon.

---

### Overview

The `apps/` directory serves as the organized gateway for frontend application distribution and execution within the SlimeVR monorepo. It decouples the core tracking daemon runtime from presentation layers, providing structured subdirectories, standardized launcher scripts, and build targets.

The primary supported desktop frontend is the **SlimeVR Electron Client**. Its source lives only in [`../gui`](../gui); [`apps/electron-gui`](./electron-gui) contains small convenience wrappers for launching and packaging it.

---

### Directory Architecture

```
apps/
└── electron-gui/                     # Desktop GUI Package Wrapper
    ├── Launch Electron SlimeVR.command # Desktop launcher script
    ├── build.sh                      # Production compilation script
    └── README.md                     # Deep technical client documentation
```

---

### Client Catalog

| Application | Technology Stack | Distribution Target | Status |
| :--- | :--- | :--- | :--- |
| **[Electron GUI](./electron-gui)** | React 18, TypeScript, Tailwind CSS, Vite, Electron | macOS Desktop (Universal), Windows, Linux | **Active / Primary** |

---

### Quick Launch Procedures

#### Desktop Launch
To launch the client together with the tracking daemon:
* Double-click [`apps/electron-gui/Launch Electron SlimeVR.command`](./electron-gui/Launch%20Electron%20SlimeVR.command) from Finder, or
* Run from repository root:
  ```bash
  ./"Launch SlimeVR.command"
  ```

#### Rebuilding the Client Bundle
To recompile the frontend renderer, preload bridges, and Electron main process:
```bash
cd apps/electron-gui && ./build.sh
```
Or execute from the workspace root:
```bash
pnpm run build
```

---

### Architectural Principles

1. **Separation of Concerns**: The frontend interfaces communicate with the tracking daemon strictly over decoupled RPC protocols (SolarXR FlatBuffers WebSocket on port `21110`). The GUI never modifies sensor fusion state directly without daemon consensus.
2. **Deterministic Launch Sequence**: Launcher scripts enforce prerequisite validation—verifying that Java 17+ and the server daemon shadow JAR exist before instantiating the Electron window.
3. **Graceful Teardown**: Closing the client triggers coordinated process shutdown signals to ensure background OSC sockets and power management locks are cleanly released.
