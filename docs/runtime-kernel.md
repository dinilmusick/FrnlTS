# FrnlTS Runtime Kernel

FrnlTS is the semantic frontend runtime layer for the Krusbl ecosystem. The core is renderer-independent; React is an adapter.

## Kernel primitives

- **Lifecycle** — explicit, validated entity lifecycle state machine.
- **Contracts** — versioned inputs/outputs/events/commands/capabilities.
- **Commands and effects** — explicit intent/effect boundaries.
- **Resources and scopes** — owned asynchronous resources with deterministic release.
- **Registry** — versioned semantic registrations and capability checks.
- **Dependencies** — dependency graph validation and topological ordering.
- **Routing** — typed route matching and URL generation.
- **Accessibility contracts** — machine-checkable semantic requirements.
- **Faults** — structured, recoverable/retryable runtime failures.

## Architecture

```text
FrnlTS Core
  ├─ semantic entities
  ├─ state/events/flows
  ├─ lifecycle
  ├─ resources/scopes
  ├─ contracts/capabilities
  ├─ dependencies
  ├─ registry/discovery
  ├─ routing
  └─ accessibility
       │
       ▼
Renderer adapters
  └─ React
       │
       ▼
Floks concrete UI assets
```

The kernel must not import React. Renderer-specific concerns belong in adapters.
