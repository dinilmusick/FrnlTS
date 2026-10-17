# FRNL-TS Documentation

FRNL-TS is the frontend semantic framework counterpart to KrnlTS.

FRNL defines the generic semantic concepts and contracts used to define UI Primitives and UI Composites. It does not store concrete UI primitives; Theta-Engine uses FRNL to author concrete UI definitions, and Floks stores reusable concrete definitions.

## Documentation

- [Architecture](architecture.md)
- [Terminology](terminology.md)
- [UI Primitives](concepts/ui-primitives.md)
- [UI Composites](concepts/ui-composites.md)
- [Slots](concepts/slots.md)
- [Flows](concepts/flows.md)
- [Bounds](concepts/bounds.md)
- [Visual Assets](concepts/visual-assets.md)
- [Properties](concepts/properties.md)
- [Curves](concepts/curves.md)
- [States](concepts/states.md)
- [Phases](concepts/phases.md)
- [Events](concepts/events.md)
- [UI Primitive reference](ui-primitive.md)
- [UI Composite invariant specification](../tests/ui-composite-invariants.md)

## Foundational model

FRNL has two first-class semantic UI entities:

- **UI Primitive** — an atomic visual and interactive UI entity.
- **UI Composite** — a structural and logical grouping of UI entities through named Slots.

A UI Composite Slot may contain either a UI Primitive or another UI Composite. This recursive containment is fundamental to the model and allows the same composition mechanism to represent controls, forms, sections, pages, and larger application UI hierarchies.

Each Slot is also a live layout and replacement boundary. It has overridable/modulatable Slot Properties, Slot Events, and a replaceable occupant. The Slot itself is not a Visual Asset.

UI Composites do not own Visual Assets. Visual rendering remains the responsibility of contained UI Primitives. Composites provide grouping, addressability, group-level state, and Flows that coordinate events and actions across their contained UI entities.
