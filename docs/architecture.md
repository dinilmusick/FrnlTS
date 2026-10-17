# FRNL-TS Architecture

FRNL-TS defines the semantic building blocks for frontend UI systems.

    FRNL-TS
    ├── UI Primitive
    │   ├── Bounds
    │   ├── Visual Assets
    │   ├── Properties
    │   ├── States
    │   └── Events
    │
    └── UI Composite
        ├── Slots
        │   └── UI Primitive | UI Composite
        │       ├── Slot Properties
        │       └── Slot Events
        ├── Properties
        ├── States
        └── Flows

FRNL-TS -> defines frontend semantic building blocks
Theta-Engine -> defines concrete UI primitives
Floks -> stores reusable concrete UI definitions

FRNL is not the component library or component store. It defines the semantic concepts and contracts that make concrete frontend definitions structurally consistent.

## UI Primitive

A UI Primitive is the atomic visual and interactive entity. It owns Bounds, Visual Assets, Properties, States, and Events.

Bounds are the authoritative interaction area. Visual Assets may extend beyond Bounds without extending the interaction area, and clipping is controlled per asset.

## UI Composite

A UI Composite is the structural and logical grouping entity.

A Composite owns:

- named Slots
- Properties
- States
- Flows

A Composite does not own Visual Assets. It can group and coordinate entities whose visual representation remains owned by the contained UI Primitives.

## Slots

A Slot is a live, addressable boundary for one UI entity.

A Slot may contain either a UI Primitive or another UI Composite. The Slot itself owns:

- Slot Properties for layout/relationship adjustment
- Slot Events for occupant and lifecycle observation

Slot Properties can be overridable and modulatable. Modulatable Slot Properties can use FRNL Curves and the same Attack/Sustain/Release temporal semantics as other properties.

A Slot's occupant can be replaced while the containing UI is actively rendering. The Slot's identity, address, Slot Properties, and Slot Event interface remain stable across replacement.

## Recursive composition

Each Composite Slot may contain either:

1. a UI Primitive, or
2. another UI Composite.

Therefore UI Composites are recursively nestable. FRNL-TS imposes no fixed maximum nesting depth.

This allows the same semantic mechanism to describe progressively larger structures:

    Page
    └── UI Composite
        ├── Header
        │   └── UI Composite
        ├── Content
        │   ├── Section
        │   │   └── UI Composite
        │   └── Section
        │       └── UI Composite
        └── Footer
            └── UI Composite

Names such as Page, Section, Header, Form, Card, or Toolbar are application-level roles represented through UI Composite definitions rather than additional foundational FRNL entity types.

## Addressability

Every Slot has a stable name within its containing Composite. Nested entities can therefore be addressed through their Composite hierarchy.

Conceptually:

    Page.content
    Page.content.profileSection
    Page.content.profileSection.name

Addressability provides a stable semantic way for parent Composites and Flows to access contained entities without requiring renderer-specific references.

## Composite state

A UI Composite may define named States, using the same Attack, Sustain, Release and Curve semantics as UI Primitive States.

Composite States do not own Visual Assets. They can represent group-level semantic configuration and coordinate properties or child-state changes. Visual changes remain owned by the affected UI Primitives.

Composite States may also change Slot Properties, allowing group states to alter or animate child layout relationships without introducing Composite Visual Assets.

## Composite flows

Flows belong to UI Composites and describe coordination between events, actions, state changes, data, and external functions.

A Primitive owns and emits its Events. Slots own Slot Events. A Composite can consume either kind of event in a Flow and coordinate what happens next.

Slot Events include State Changed and Occupant Changed.

Flows may also change Slot occupants, Slot Properties, and repeatable Slot collection membership at runtime.

Flows are the frontend-level analogue of orchestration: they coordinate existing UI entities and external operations rather than embedding application business logic into Visual Assets or primitive rendering.

## Temporal model

A Curve has a canonical one-second domain. Curves do not own playback duration.

- Attack has an explicit finite duration.
- Release has an explicit finite duration.
- Sustain has no duration.
- During Sustain, property curves loop over their one-second domain.
- During Attack and Release, the one-second curve is stretched or compressed to the phase duration.

This temporal model applies to any modulatable property, including applicable Slot Properties.

State does not own a timeline duration. Phase execution determines temporal interpretation.

## Runtime validation boundary

FrnlTS uses **Zod as a default runtime validation layer**. TypeScript provides compile-time types, while Zod validates runtime values entering semantic framework assets and state boundaries.

The default rule is:

    injected input
        ↓
      Zod schema
        ↓
    validated semantic value
        ↓
    Zustand / React asset / Flow / Event

This applies to React asset inputs, Zustand store mutations, injected payloads, Slot occupants, property updates, Flow inputs, and event payloads. Framework-defined event payloads are validated before emission.

Schemas are part of the semantic contract; renderer-specific validation mechanisms do not replace the FrnlTS validation boundary.
