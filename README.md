# FrnlTS (`@dinilmusick/frnlts`)

> **A semantic frontend framework for defining and running Frnl Elements.**

FrnlTS defines frontend/UI semantics, element structure, state behavior, visual definitions, and runtime boundaries. A Frnl component is the React component itself; FrnlTS does not wrap React components in semantic classes or adapter components. It is an independent frontend architecture within the Krusbl ecosystem.

---

## Architectural Role in the Krusbl Ecosystem

```text
                    Krusbl Ecosystem

Backend                                      Frontend
───────                                      ────────

KrnlTS                                       FrnlTS
  │                                            │
  │ Service                                    │ React Components
  │ Service                                    │ Frnl State
  │ Orchestration                              │ Frnl Events
  │ State                                      │ Slots
  │ Events                                     │ Flows
  ▼                                            ▼
Applications                                 Applications


                        Concrete Libraries

              KrnlTS  →  Depm/etc.

              FrnlTS
                 │
                 ▼
               Floks
                 │
       ┌─────────┴─────────┐
       │                   │
   UI Primitive        UI Composite
       │                   │
   Simple Button       Complex Button
   Icon                Dialog Button
   Badge               Split Button
   Input               Rich Control
```

- **FrnlTS defines what frontend Elements mean.** (Semantic model, runtime state, and validation boundaries).
- **Floks defines which concrete UI elements exist.** (Reusable UI component library built on FrnlTS contracts).
- **Applications compose those elements.** (Application-specific screens and workspaces).

---

## Core Semantic Model

FrnlTS is built around two first-class foundational UI entities:

1. **UI Primitive**
   - Atomic visual and interactive entity.
   - Owns **Bounds**, **Visual Assets**, **Properties**, **States**, and **Events**.
   - Interaction is strictly evaluated against Bounds.
2. **UI Composite**
   - Structural and logical grouping entity.
   - Owns **named Slots**, **Properties**, **States**, and **Flows**.
   - Does **not** own Visual Assets (rendering is provided by contained Primitives).
   - Recursive: a Slot can contain either a UI Primitive or another UI Composite.

### Key Concepts

- **Slots**: Addressable live positions inside a Composite. Can hold either a Primitive or Composite. Supports real-time occupant replacement while preserving Slot identity, address, properties, and event interface.
- **Repeatable Slot Collections**: Named families of Slot instances (e.g., `Page.items[0]`, `Page.items[1]`) that can dynamically grow, shrink, or reorder at runtime.
- **States & Curves**: Named states evaluated using normalized 1-second domain Curves with Attack, Sustain, Release temporal semantics.
- **Events & Flows**: Primitives own Events. Slots own Slot Events (`stateChanged`, `occupantChanged`, `propertyChanged`). Composites own Flows that coordinate events, state changes, slot occupants, and external actions.
- **Hierarchical Addressability**: Semantic addresses such as `DashboardPage.content.overview.actions.save`.

---

## Zod Runtime Validation Architecture

TypeScript types are verified at compile time, but **all external semantic inputs, property updates, and event payloads cross a Zod validation boundary** before entering the runtime:

```text
external input / event
        ↓
  Zod validation
        ↓
validated semantic data
        ↓
Zustand runtime (component state / Slot / Event / Flow)
```

- `createFrnlStore(initial?)`: strictly validates initial entities and slots.
- `emit(event)`: validates events against the canonical discriminated union `frnlEventSchema`.
- `setEntityState`, `setEntityProperty`, `setSlotProperty`: validate IDs, keys, and values.
- `replaceSlotOccupant`: validates occupant descriptors and emits validated `slot.occupantChanged`.
- Entity state transitions automatically emit `slot.stateChanged` for occupying slots.

---

## Installation & Usage

```bash
pnpm add @dinilmusick/frnlts zustand zod
```

### 1. Direct Frnl React Components

A Frnl component is the React component itself. FrnlTS does not wrap a React component in a semantic class, primitive, composite, renderer, or executor.

Use `useFrnlComponent()` inside the concrete React component. The hook attaches the component instance to the Zustand-backed Frnl store and exposes its addressable Frnl events.

```text
React component
    │
    ├── normal React props/events
    ├── Frnl state
    ├── Frnl visual definitions
    └── Frnl events
            │
            ▼
       Zustand store
```

### 2. Addressable Frnl Events

React events are entry points into the component's Frnl events. The same Frnl event can be invoked from another component, a keyboard binding, or application code:

```typescript
getFrnlEvent(store, 'action-button', 'click')(payload);
```

Resolution is state-dependent:

```text
React event / keyboard / application code
                 ↓
        component → Frnl event
                 ↓
          current Frnl state
                 ↓
          state.events[event]
                 ↓
          functionId → handler
```

### 3. Slots

`FrnlSlot` is itself a React component backed by the Frnl store. It provides stable addressable positions and live occupant replacement without wrapping the occupant component.

## Package Exports

The package is strictly ESM. Frnl state/event machinery is shared through the runtime, while concrete Frnl UI components are ordinary React components using the Frnl React hook:

- `.` (`@dinilmusick/frnlts`): Complete semantic framework and runtime exports.
- `./runtime` (`@dinilmusick/frnlts/runtime`): Headless frontend runtime entry point (`createLifecycle`, `createScope`, `defineResource`, `FrnlRegistry`, `DependencyGraph`, `matchRoute`, `buildRouteUrl`, `FrnlRouter`, `validateAccessibility`).
- `./react` (`@dinilmusick/frnlts/react`): `useFrnlComponent` and `FrnlSlot` for direct Frnl React components.
