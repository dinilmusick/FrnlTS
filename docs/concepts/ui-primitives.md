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

## Relationship to UI Composites and Slots

A UI Composite can contain a Primitive directly through one of its Slots. A Composite can also contain another Composite, making the overall UI hierarchy recursively nestable.

The Primitive remains responsible for its own visual assets, properties, states, and primitive-level interaction.

A Slot provides the parent-controlled relationship around the Primitive. The Slot may override or modulate layout-related properties such as position, scale, rotation, visibility, ordering, and alignment without changing the Primitive's intrinsic definition.

The Slot may also replace the Primitive at runtime. When that happens, the Slot emits Occupant Changed and remains addressable at the same Slot path.

FRNL defines the concepts and contracts. Concrete primitive definitions are authored by Theta-Engine.
