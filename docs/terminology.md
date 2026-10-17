# FRNL-TS Terminology

## UI Primitive
The atomic reusable UI entity defined using FRNL semantics. It owns Bounds, Visual Assets, Properties, States, and Events.

## UI Composite
A structural and logical grouping of UI entities. A Composite owns named Slots, Properties, States, and Flows, but does not own Visual Assets.

## Slot
A named position/address within a UI Composite that contains one UI entity. A Slot may contain either a UI Primitive or another UI Composite.

## Recursive composition
The rule that UI Composite Slots may contain UI Composites as well as UI Primitives. This allows Composites to nest without a fixed depth and supports hierarchies such as Page -> Section -> Form -> control.

## Addressability
The hierarchical naming mechanism used to access entities through their containing Composite Slots.

## Flow
A coordination definition owned by a UI Composite. A Flow connects events from contained entities to actions, state changes, data operations, or external functions.

## Bounds
The geometric area occupied by a UI Primitive for interaction. Pointer interaction outside Bounds does not trigger the primitive's pointer events.

## Visual Asset
A rendered visual belonging to a UI Primitive. A primitive may contain multiple Visual Assets. Assets expose editable properties such as content, position, transform, opacity, tint, and other rendering properties.

## State
A named definition of semantic configuration and editable property values. UI Primitives and UI Composites may both define States. State values may be represented as static values or curves and are interpreted through Attack, Sustain, and Release phases. A Composite State does not own Visual Assets.

## Curve
A mapping over a canonical one-second domain. Curves do not define their own duration.

## Phase
A temporal mode of State execution: Attack, Sustain, or Release.

## Event
A callable interaction or programmatic occurrence exposed by a UI Primitive. Standard categories include pointer/mouse events and keyboard events; custom events are also supported.

## Function
External application logic invoked by an Event or Flow. FRNL defines the invocation semantics, not application-specific business logic.

## Clipping
A per-Visual-Asset rendering option. When enabled, the asset is clipped to the UI Primitive's Bounds. Clipping does not affect the interaction boundary.
