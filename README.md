# FrnlTS (`@dinilmusick/frnlts`)

> **The Frontend Semantic Framework Counterpart to KrnlTS.**

Where **KrnlTS** defines the semantic framework for backend services, entities, and orchestrations, **FrnlTS** provides the renderer-independent, predictable semantic model for frontend user interfaces.

---

## Architectural Role in the Krusbl Ecosystem

```text
                    Krusbl Ecosystem

Backend                                      Frontend
───────                                      ────────

KrnlTS                                       FrnlTS
  │                                            │
  │ Service                                    │ UI Primitive
  │ Service                                    │ UI Composite
  │ Orchestration                              │ Slot
  │ State                                      │ State
  │ Events                                     │ Events
  │                                            │ Flows
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

- **FrnlTS defines what UI entities mean.** (Semantic model, runtime state, and validation boundaries).
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
Zustand runtime (Primitive / Composite / Slot / Event / Flow)
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

### 1. Semantic Runtime (Renderer-Agnostic)

```typescript
import { createFrnlStore } from '@dinilmusick/frnlts';

const store = createFrnlStore();

// Register a UI Primitive
store.getState().registerEntity('submit-button', {
  kind: 'primitive',
  state: 'default',
  properties: { label: 'Submit', variant: 'primary' },
});

// Register a UI Composite with a live Slot
store.getState().registerEntity('login-form', {
  kind: 'composite',
  state: 'idle',
  properties: {},
});

store.getState().registerSlot('login-form.submit', {
  id: 'login-form.submit',
  address: 'login-form.submit',
  occupantId: 'submit-button',
  occupantKind: 'primitive',
  properties: { scale: 1 },
});

// Listen to validated events
store.getState().setEntityState('submit-button', 'loading');
// Emits entity.stateChanged AND slot.stateChanged on login-form.submit!
```

### 2. React Assets (`@dinilmusick/frnlts/react`)

```tsx
import React from 'react';
import { FrnlPrimitive, FrnlComposite, FrnlSlot } from '@dinilmusick/frnlts/react';
import { createFrnlStore } from '@dinilmusick/frnlts';

const store = createFrnlStore();

export function ActionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <FrnlPrimitive
      id="action-btn"
      as="button"
      store={store}
      state="default"
      properties={{ label }}
      hostProps={{ onClick, type: 'button' }}
    >
      {label}
    </FrnlPrimitive>
  );
}

export function Shell({ content }: { content: React.ReactNode }) {
  return (
    <FrnlComposite
      id="app-shell"
      store={store}
      slots={
        <FrnlSlot
          id="main-slot"
          address="Shell.main"
          occupantId="view"
          occupantKind="primitive"
          store={store}
          occupants={{
            view: content,
          }}
        />
      }
    />
  );
}
```

---

## Package Exports

The package is strictly ESM and separates the renderer-agnostic core from the React asset adapter:

- `.` (`@dinilmusick/frnlts`): Complete semantic framework and runtime exports.
- `./runtime` (`@dinilmusick/frnlts/runtime`): Headless frontend runtime entry point (`createLifecycle`, `createScope`, `defineResource`, `FrnlRegistry`, `DependencyGraph`, `matchRoute`, `buildRouteUrl`, `FrnlRouter`, `validateAccessibility`).
- `./react` (`@dinilmusick/frnlts/react`): React adapter components (`FrnlPrimitive`, `FrnlComposite`, `FrnlSlot`) and React prop validators.
