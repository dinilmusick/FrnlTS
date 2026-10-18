# FrnlTS Element Architecture

FrnlTS treats **Element** as the semantic union of two independent kinds:

- **Primitive** — a fundamental UI element.
- **Composite** — an element that may compose other Elements.

Primitive is not a child implementation of Composite. A Composite may contain a Primitive at runtime, but that composition relationship is not represented by the Element definition's filesystem hierarchy.

## Canonical element definition layout

Each concrete Element owns its own directory:

```text
<element-name>/
├── <element-name>.ts
└── states/
    ├── <state-name>/
    │   ├── events/
    │   │   ├── <event-name>.ts
    │   │   └── ...
    │   └── phases/
    │       ├── attackPhase/
    │       │   └── visualDefinition.ts
    │       ├── sustainPhase/
    │       │   └── visualDefinition.ts
    │       └── releasePhase/
    │           └── visualDefinition.ts
    └── ...
```

The root `<element-name>.ts` file is the **facade** for the Element.

State names are user-defined. Each state contains:

1. an `events/` directory, with one file per event;
2. a `phases/` directory containing exactly `attackPhase`, `sustainPhase`, and `releasePhase`;
3. one `visualDefinition.ts` inside each phase.

## Event semantics

Events are state-local. The same event name may exist in multiple states and resolve to different functions:

```text
current state
    ↓
state.events.<event>
    ↓
function
    ↓
backend facade / feature / endpoint
       OR
library function
```

FrnlTS does not require a general event-listener graph between Elements.

## Phase semantics

A state is the semantic mode. Its three phases are temporal/visual phases of that state:

```text
State
├── Events
└── Phases
    ├── Attack → Visual Definition
    ├── Sustain → Visual Definition
    └── Release → Visual Definition
```

The three phases must not be modelled as separate states.

## Architectural boundary

Primitive and Composite share the Element contract but remain independently definable. Filesystem structure must not imply:

```text
Composite
└── Primitive
```

Instead:

```text
Element
├── Primitive
└── Composite
```

Composition is a semantic/runtime relationship, not a Primitive-inside-Composite implementation dependency.
