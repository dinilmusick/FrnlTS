# UI Primitives

A UI Primitive is the atomic reusable visual and interactive UI entity defined using FRNL semantics.

A primitive owns:

- Bounds
- Visual Assets
- Properties
- States
- Events

## Composition

A UI Primitive may be placed into a named Slot of a UI Composite.

    UI Primitive
    ├── Bounds
    ├── Visual Assets
    ├── Properties
    ├── States
    └── Events

A Primitive does not own or contain UI Composite Slots. Structural grouping is provided by UI Composites.

## Relationship to UI Composites

A UI Composite can contain a Primitive directly through one of its Slots. A Composite can also contain another Composite, making the overall UI hierarchy recursively nestable.

The Primitive remains responsible for its own visual assets and primitive-level interaction. The containing Composite is responsible for grouping, addressability, group-level state, and Flows that coordinate the Primitive with other entities.

FRNL defines the concepts and contracts. Concrete primitive definitions are authored by Theta-Engine.
