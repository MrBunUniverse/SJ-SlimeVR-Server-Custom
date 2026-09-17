---
trigger: on_demand
description: Optional Graphify assistance for cross-cutting architecture questions
---

# Graphify

Use `graphify-out/` only when a task spans several subsystems and the source call graph is expensive to reconstruct manually. Prefer `graphify query "<question>"` or `graphify explain "<concept>"`; do not read the full generated graph.

Graphify output is a cache, not authoritative source. Confirm important conclusions against current files. Do not regenerate it for routine edits; update it only when explicitly requested or after a substantial source-tree reorganization.

For current-structure queries, exclude `.agents/archive/`, `solarxr-protocol/`, `bindings-provider/openvr/`, and build/output directories unless they are explicitly in scope. Treat vendored, generated, and archived nodes as context—not project design guidance.
