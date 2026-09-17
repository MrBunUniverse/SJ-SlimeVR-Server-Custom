---
name: graphify
description: Refresh or query the optional project knowledge graph
---

# Graphify Workflow

For architecture questions, query the existing cache first:

```bash
graphify query "<focused question>"
```

Run `graphify update .` only when the user explicitly requests a refresh or after a substantial source-tree reorganization. Treat results as navigation hints and verify conclusions against current source.
