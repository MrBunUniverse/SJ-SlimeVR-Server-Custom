# Performance and structure audit — 2026-09-08

The existing Electron / React frontend, Kotlin tracking server, and shared SolarXR protocol are a reasonable separation of responsibilities. A wholesale rewrite or directory reshuffle would not itself make tracking faster. This audit inspected the main build, packaging, data-feed, tracker-state, WebSocket, telemetry, launcher, and dependency paths; it is not a line-by-line certification of the entire repository or a live hardware benchmark. Existing uncommitted development work was preserved.

## Changes made

- Enabled esbuild minification for the production Electron renderer. Development behavior, styles, animation definitions, and feed rates remain unchanged.
- Receive WebSocket binary frames as ArrayBuffer directly. Removes asynchronous Blob conversion per incoming packet and processes packets in arrival order. Removed an RPC counter that was incremented but never read.
- Memoized tracker and skeleton feed configuration objects by effective feed rate. Components using tracker helpers no longer recreate protocol masks on every render. Rates remain 10/40 Hz normally and 90 Hz in fast debug mode.
- Removed the per-tick telemetry tracker-list copy. `allTrackers` creates a new FastList; the server tick now passes its existing list to telemetry, which synchronously formats samples and queues only strings. This avoids one list copy per server tick, including when recording is disabled, without exposing a mutable list to the writer thread.
- Removed unused production dependencies `@ryuziii/discord-rpc` and `discord-rich-presence`. The active implementation uses `@xhayper/discord-rpc`. Updated lockfile importer entries and verified them with an offline frozen-lockfile check. Historical unused resolution entries remain in the lockfile; existing local node_modules was not pruned.
- Fixed the GUI test runner to return exit status 1 on test failures. Added two tests exercising production feed configuration and WebSocket decoding with actual FlatBuffers packets and mocked platform boundaries.
- Applied Prettier to two pre-existing formatting failures in MainLayout and RemotePage; no visual behavior changes were intended.

Production build output measured in this workspace: renderer JavaScript **5,756.80 KB → 3,059.73 KB (46.8% smaller)**; CSS **160.75 KB → 132.01 KB (17.9% smaller)**. These are emitted asset sizes, not total installer size or measured runtime memory.

## Structure, overlap, and files

| Area | Assessment |
| --- | --- |
| `apps/electron-gui` | Convenience launch/build wrappers; canonical source remains in `gui`. |
| SolarXR generated Java / TypeScript / C++ | Deliberate cross-language protocol outputs, not redundant application logic. Keep. |
| `.agents/skills` | About 604 KB of developer guidance; not shipped or loaded by the app. Removing skills would not improve runtime speed. Keep the development runbook and design guidance. |
| `.agents/archive` | About 340 KB of historical development notes; not runtime code. |
| `graphify-out` | About 329 MB of generated analysis, excluded from app packaging. Optional disk cleanup, no runtime benefit. Preserved because it is used by repository navigation rules. |
| `.backup` | About 22 MB of backups. Preserved; deleting recovery copies would not improve app runtime. |
| build outputs and dependency caches | Rebuildable but needed for local development; deleting them slows the next build. |
| Large screen components | TopBar, RemotePage, and settings pages combine substantial UI and logic. Splitting them may improve maintenance but is not proof of faster rendering. No visual refactor was made. |

## Remaining opportunities and limitations

- The renderer remains one large entry chunk. Route-level lazy loading could reduce startup work, but should be measured and checked for navigation/loading-state changes before adoption.
- Packet subscriptions currently detach and reattach listeners when inline callbacks change. A shared stable-subscription hook is a possible follow-up with React lifecycle tests.
- Tracker state uses deep comparisons and repeated list projections. Profile realistic 8/16/32-tracker sessions before replacing this with indexing or narrower subscriptions; these comparisons also prevent unnecessary renders.
- Telemetry writes use an unbounded executor queue and flush each sample. Slow storage could accumulate pending writes. A rapid stop/start also risks the asynchronous close referencing a newer session's writer. Session isolation and bounded buffering need dedicated recording tests before changing this subsystem further.
- Existing GUI tests predominantly check source contracts and simulated helper behavior; their “E2E” name does not mean a real browser or connected headset was tested. The new tests execute production hooks with controlled platform boundaries.
- No measured FPS, RAM, live latency, or battery improvement is claimed. Real-device animation and streaming verification remains necessary for those claims.

## Verification

- GUI TypeScript, ESLint (zero warnings), and Prettier: pass.
- GUI tests: 85 passed (83 existing plus 2 production-hook regression tests).
- Negative runner check: an intentionally failing temporary test exits 1.
- Electron production build: pass; remaining large-chunk and upstream deprecation notices are reported by the build tools.
- Backend shadow JAR rebuilt successfully; 491 backend tests passed with zero failures/errors. Existing compiler/Gradle warnings remain.
- Frozen offline lockfile validation and `git diff --check`: pass.
- Protocol sources were not edited; no protocol regeneration was needed.
