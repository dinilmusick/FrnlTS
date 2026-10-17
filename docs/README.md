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

## Runtime validation

FrnlTS uses **Zod by default for runtime validation**. All injected payloads and semantic inputs entering framework code assets, Zustand state mutations, Slot operations, Flow inputs, and event payloads must be validated against the applicable Zod schema. TypeScript remains the compile-time layer; Zod provides runtime enforcement.

## Reliability and publishing contract

FrnlTS is the semantic frontend framework for building reliable UI systems, analogous to KrnlTS for backend services. Applications define UI through exactly two first-class entities: UI Primitive and UI Composite. Zustand is the runtime state mechanism and Zod is the runtime validation boundary for semantic inputs and event payloads.

FrnlTS is published as the reusable @dinilmusick/frnlts npm package. Renderer-facing React assets are exposed through the @dinilmusick/frnlts/react entry point; FrnlTS owns the semantic contract, not application-specific visual design.

Floks consumes FrnlTS and defines the canonical concrete UI element library. A simple element such as a basic Button is a UI Primitive. More involved variants may be UI Composites composed from Frnl primitives and slots. This distinction is semantic and does not require every visual variant to have the same structural category.
