---
description: Change-based verification and generated-artifact safety for SlimeVR
trigger: always_on
---

# Build Integrity

Use the verification matrix in [`../../AI_DEVELOPMENT.md`](../../AI_DEVELOPMENT.md). Select checks from the files actually changed, and trust current command output rather than a hard-coded test count.

Key invariants:

- GUI logic: run `cd gui && pnpm run lint && pnpm test --run`.
- Electron/Vite packaging changes: also run `cd gui && pnpm run build`.
- Server Kotlin/Java: run relevant Gradle tests and rebuild with `./gradlew :server:desktop:shadowJar`.
- Protocol changes: run `cd solarxr-protocol && pnpm run build`, clear only `gui/node_modules/.vite`, then verify the GUI.
- Documentation-only changes do not require rebuilding the application, but links, commands, and `git diff --check` must pass.

Never edit a generated artifact as a substitute for changing its source.
