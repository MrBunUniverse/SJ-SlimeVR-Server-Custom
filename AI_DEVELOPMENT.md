# AI Development Guide

This is the shared source of truth for GPT/Codex, Gemini, and other coding agents working in this repository. Model-specific entry files should point here instead of duplicating these rules.

## Priorities

1. Follow the user's current request and preserve its scope.
2. Preserve existing work. This repository may be intentionally dirty; never reset, discard, or rewrite unrelated changes.
3. Fix the root cause with the smallest maintainable change.
4. Verify in proportion to the files changed and report actual results. Never hard-code an expected test count in instructions.

## Repository Map

| Area | Canonical location | Notes |
| --- | --- | --- |
| Electron main/preload | `gui/electron/` | Native integration, lifecycle, IPC, Quest audio |
| React interface | `gui/src/` | Components, hooks, state, styling |
| GUI tests | `gui/tests/` | Node-based automated suites |
| Tracking server | `server/core/` | Kotlin tracking, OSC, RPC, configuration |
| Desktop server | `server/desktop/` | Desktop entry point and packaged JAR |
| Protocol | `solarxr-protocol/` | Git submodule; FlatBuffers and generated libraries |
| OpenVR bindings | `bindings-provider/` | Includes the `openvr` submodule |
| Launch helpers | `Launch SlimeVR.command`, `Stop SlimeVR.command` | Keep process matching project-scoped |
| Documentation | `docs/` | Start at `docs/README.md` |

Do not treat `.backup/`, `.gradle/`, `.kotlin/`, `.pnpm-store/`, `.tools/`, `build/`, `graphify-out/`, `gui/out/`, or any `node_modules/` directory as source. Do not edit generated output when a source file or build command exists.

## Working Method

1. Read the request, `git status --short`, and the files directly involved. Assume existing changes belong to the user.
2. Use `rg` or direct paths to trace callers, configuration, and tests. For visual UI work, consult `UI_MAP.md` first as a locator, then verify the referenced code because line hints can drift.
3. Prefer existing helpers, platform facilities, and installed dependencies. Add abstractions or dependencies only when they reduce real complexity.
4. Keep edits focused. Do not combine a feature or bug fix with unrelated formatting, renaming, deletion, or repository cleanup.
5. Treat `solarxr-protocol/` and `bindings-provider/openvr/` as submodules. Do not change their revisions or generated contents unless the request requires it.
6. Use project-scoped process cleanup. Never kill every Java, Electron, ADB, or scrcpy process on the machine.

## Multi-model workflow

Use model specialization, one writer, and one final owner. Model names are routing hints; current files and checks decide correctness.

| Role | Preferred models | Output |
| --- | --- | --- |
| Scout | Gemini 3.8 Flash, GPT-5.6 Luna | Read-only facts, paths, risks |
| Builder | GPT-5.6 Terra, GPT-5.6 Sol | Focused change in an isolated worktree |
| Reviewer | GPT-5.6 Sol, GPT-6 Astra when available | Read-only diff findings |
| Integrator | GPT-6 Astra or GPT-5.6 Sol | Resolve conflicts and run final checks |

Rules:

- One writer per checkout. Parallel builders use separate worktrees.
- Scout reports include files inspected, facts, uncertainty, and the recommended next action.
- Builder handoffs include changed files, behavior, checks, and remaining risks.
- Reviewers inspect the current diff; they do not trust another model's summary.
- The integrator owns conflict resolution and final verification.
- Use one scout and one reviewer by default. Add parallel workers only for independent tasks.
- Use fast models for discovery, documentation, and small edits; use higher reasoning for cross-subsystem, security, protocol, and final integration work.
- Never treat model output, archive notes, generated graph data, or fixed test totals as current truth.

## Verification Matrix

Run the checks for every area touched. If a command cannot run, report the exact reason; do not claim success.

| Changed area | Required verification |
| --- | --- |
| Documentation or agent instructions only | `git diff --check` and verify referenced paths/commands exist |
| `gui/src/`, `gui/electron/`, or GUI configuration | `cd gui && pnpm run lint && pnpm test --run` |
| Electron/Vite build or packaging behavior | GUI checks above, then `cd gui && pnpm run build` |
| Kotlin/Java under `server/` | Relevant Gradle tests, then `./gradlew :server:desktop:shadowJar` |
| `solarxr-protocol/` | `cd solarxr-protocol && pnpm run build`, then remove only `gui/node_modules/.vite` before GUI verification |
| Shell launcher | `bash -n <exact-script>` plus a project-scoped process/port check when lifecycle behavior changed |

Use the current command output as the truth. Test totals can grow over time.

## UI Navigation

`UI_MAP.md` is a fast index, not a prohibition against validating the code. Use its paths first. If a path, symbol, or line hint is stale, locate the current symbol with a narrow `rg` query and update the map when the component location or responsibility materially changed.

## Safety and Completion

- Validate external input at IPC, network, file, and process boundaries.
- Preserve user data and configuration; prefer recoverable operations.
- Avoid broad `pkill`, recursive deletion, and unverified migrations.
- Do not silently modify submodules, lockfiles, or generated assets.
- Finish with a concise summary of changed files, behavior, verification, and any remaining limitation.
