# SJ SlimeVR Server

[![Build](https://github.com/MrBunUniverse/SJ-SlimeVR-Server-Custom/actions/workflows/build.yml/badge.svg)](https://github.com/MrBunUniverse/SJ-SlimeVR-Server-Custom/actions/workflows/build.yml)
[![License](https://img.shields.io/badge/license-MIT%20%2F%20Apache--2.0-blue)](#license)
![Status](https://img.shields.io/badge/status-early%20development-orange)

An unofficial, macOS-focused fork of the [SlimeVR server](https://github.com/SlimeVR/SlimeVR-Server) for open-source full-body tracking, with a redesigned desktop interface, tracker reliability work, and Meta Quest / VRChat OSC tools.

> **Status: early development.** This project is a work in progress. Expect rough edges, behaviour changes between versions, and unfinished features. It is **not** an official SlimeVR release and is not affiliated with or endorsed by the SlimeVR team.

## What it is

- **Server** (`server/`): Kotlin tracking server. It receives tracker data over UDP, solves the skeleton, and serves SolarXR RPC and OSC output.
- **Desktop app** (`gui/`): Electron, React and TypeScript interface for trackers, resets, calibration, settings and Quest tooling.
- **Protocol** (`solarxr-protocol/`): SolarXR FlatBuffers schema, kept as a submodule in [SJ-SolarXR-Protocol](https://github.com/MrBunUniverse/SJ-SolarXR-Protocol).

## Current focus

Work in this fork so far, all still evolving:

- Redesigned desktop interface (macOS first).
- Tracker connection recovery and adaptive drift compensation.
- Meta Quest and VRChat OSC integration and diagnostics.
- Expanded automated tests for the server and the interface.

Planned or incomplete: Windows and Linux testing, packaged installers, more tracker tuning options, and further interface polish. See the [releases](https://github.com/MrBunUniverse/SJ-SlimeVR-Server-Custom/releases) for what has shipped.

## Getting started

Prerequisites: JDK 17 or newer, Node.js 22 (see `.node-version`), and [pnpm](https://pnpm.io).

```bash
git clone --recurse-submodules https://github.com/MrBunUniverse/SJ-SlimeVR-Server-Custom.git
cd SJ-SlimeVR-Server-Custom
pnpm install
```

On macOS, start and stop everything with the launcher scripts:

```bash
./scripts/"Launch SlimeVR.command"
./scripts/"Stop SlimeVR.command"
```

## Development

```bash
./gradlew :server:desktop:shadowJar   # build the server JAR
./gradlew :server:core:test           # server tests
cd gui && pnpm run lint               # type-check, lint and format check
cd gui && pnpm test                   # interface tests (needs Node 22)
cd gui && pnpm run gui                # run the desktop app in development mode
cd gui && pnpm run build              # production build
```

Where things live:

| To change | Look in |
| :--- | :--- |
| Desktop interface | [`gui/src`](gui/src) |
| Electron / macOS integration | [`gui/electron`](gui/electron) |
| Tracking, filtering, OSC | [`server/core`](server/core) |
| Protocol messages | [`solarxr-protocol`](solarxr-protocol) |

More detail is in [`docs/`](docs/README.md), including the [contributing guide](docs/CONTRIBUTING.md).

## Credits

Built on the work of the [SlimeVR](https://slimevr.dev) project and its contributors. SlimeVR is a trademark of its owners; see [docs/TRADEMARK.md](docs/TRADEMARK.md).

## License

The root [LICENSE](LICENSE) is Apache 2.0. Server code is MIT, and new contributions are dual-licensed under MIT and Apache 2.0, as in upstream. See [`docs/licenses/`](docs/licenses) and [`server/LICENSE.md`](server/LICENSE.md).
