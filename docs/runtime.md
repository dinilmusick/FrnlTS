# FrnlTS Frontend Runtime

FrnlTS is the semantic frontend runtime layer for the Krusbl ecosystem. The core runtime is renderer-independent; React is an adapter.

KrnlTS (`@ultrst-armada/krnl`) serves as the backend semantic kernel for backend services and capability orchestration. FrnlTS (`@dinilmusick/frnlts`) serves as its frontend runtime counterpart for semantic UI Primitives, Composites, Slots, Flows, and rendering adapters.

## Runtime Primitives

- **Lifecycle** (`src/runtime/core.ts`) — explicit, validated entity lifecycle state machine (`created`, `initializing`, `mounted`, `active`, `suspended`, `resuming`, `disposing`, `disposed`, `failed`).
- **Contracts** (`src/runtime/core.ts`) — versioned inputs, outputs, events, commands, and capabilities.
- **Commands and Effects** (`src/runtime/core.ts`) — explicit intent, payload definitions, and effect execution boundaries with `AbortSignal`.
- **Faults** (`src/runtime/core.ts`) — structured, recoverable, and retryable `FrnlFault` failure model preserving underlying causes.
- **Resources and Scopes** (`src/runtime/resources.ts`) — owned asynchronous resources with idempotent acquisition, deterministic release, and cascading parent/child disposal.
- **Registry** (`src/runtime/registry.ts`) — versioned semantic registrations, capability checks, and version downgrade prevention.
- **Dependencies** (`src/runtime/dependencies.ts`) — dependency graph validation, cycle detection, and topological ordering.
- **Routing** (`src/runtime/routing.ts`) — typed route matching, wildcard support, and parameter URL encoding/decoding round-trips.
- **Accessibility Contracts** (`src/runtime/accessibility.ts`) — machine-checkable semantic accessibility rules (accessible names, roles, required attributes, focusability).
- **Semantic Store** (`src/runtime/store.ts`) — Zustand-backed reactive store for UI entities, slots, repeatable collections, and flows.

## Architecture

```text
FrnlTS Core Runtime (@dinilmusick/frnlts)
  ├─ semantic entities & slots (store)
  ├─ state/events/flows
  ├─ lifecycle state machine (core)
  ├─ resources/scopes
  ├─ contracts/capabilities
  ├─ dependencies & topology
  ├─ registry/discovery
  ├─ routing
  └─ accessibility validation
       │
       ▼
Renderer Adapters (@dinilmusick/frnlts/react)
  └─ React (FrnlPrimitive, FrnlComposite, FrnlSlot)
       │
       ▼
Floks Concrete UI Assets
  └─ UI definitions conforming to FrnlTS semantics
```

## Runtime Package Subpaths

- `@dinilmusick/frnlts` — Complete semantic runtime exports.
- `@dinilmusick/frnlts/runtime` — Dedicated headless frontend runtime entry point (no React dependency).
- `@dinilmusick/frnlts/react` — React renderer adapter components (`FrnlPrimitive`, `FrnlComposite`, `FrnlSlot`).
