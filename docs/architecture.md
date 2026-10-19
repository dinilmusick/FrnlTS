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
- visual definitions
- state-local events
- event handlers
- a semantic parent
- a selected theme
- libraries

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

## React composition

React owns children, composition, layout, positioning, dimensions, and DOM bounds. FrnlTS does not maintain a parallel layout or slot tree.

## Flows

Flows coordinate component events, state transitions, property changes, data operations, and external functions. A flow is orchestration data/runtime, not another UI component type.

## Temporal model

Curves have a canonical one-second domain. Attack and Release stretch/compress the curve to their phase durations; Sustain loops it over the canonical domain.

## Runtime validation

Zod validates semantic values entering the runtime. TypeScript supplies compile-time contracts; Zod supplies runtime enforcement.
