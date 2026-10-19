# FRNL-TS Architecture

FrnlTS attaches semantic runtime machinery directly to ordinary React components.

```text
Ordinary React component
        │
        ├── useFrnlComponent()
        │      ├── state
        │      ├── state-resolved events
        │      ├── visual parameters
        │      ├── themes
        │      └── component scope
        │
        ├── FrnlSlot
        │      ├── stable address
        │      ├── slot properties
        │      └── occupant lifecycle
        │
        └── normal React composition
                │
                ▼
        Zustand-backed Frnl runtime
```

## Component

The React component itself is the concrete UI entity. FrnlTS does not create a semantic wrapper class around it.

A component can have:

- state
- properties
- bounds
- visual definitions
- state-local events
- event handlers
- a semantic parent
- a selected theme
- libraries
- slot participation

Whether a component is visually atomic, renders children, represents a page, or coordinates a complex UI is an implementation concern of that React component. It does not change its Frnl runtime category.

## State and events

States contain named events. Event invocation first resolves the component's current state and then resolves the requested event within that state.

```text
input source
    ↓
component event
    ↓
current component state
    ↓
state.events[event]
    ↓
functionId
    ↓
registered handler
```

React handlers, keyboard bindings, application code, and other components therefore use the same semantic event path.

## Slots

A Slot is a live, addressable boundary for rendered component content. It preserves its identity and address while its occupant changes.

Slot state includes the occupant identifier and slot properties. Occupant replacement emits `slot.occupantChanged`; state changes of the occupying component emit `slot.stateChanged`.

Slots can be used recursively because an occupant is simply another component instance.

## Flows

Flows coordinate component events, slot events, state transitions, property changes, data operations, and external functions. A flow is orchestration data/runtime, not another UI component type.

## Temporal model

Curves have a canonical one-second domain. Attack and Release stretch/compress the curve to their phase durations; Sustain loops it over the canonical domain.

## Runtime validation

Zod validates semantic values entering the runtime. TypeScript supplies compile-time contracts; Zod supplies runtime enforcement.
