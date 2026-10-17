# FRNL-TS Terminology

## UI Primitive
The atomic reusable UI entity defined using FRNL semantics. It owns Bounds, Visual Assets, Properties, States, and Events.

## UI Composite
A structural and logical grouping of UI entities. A Composite owns named Slots, Properties, States, and Flows, but does not own Visual Assets.

## Slot
A named, addressable position inside a UI Composite containing one UI entity at a time. A Slot may contain either a UI Primitive or another UI Composite. A Slot has its own overridable/modulatable Properties and Slot Events.

## Slot Property
A Property controlling the relationship between a Slot and its occupant, such as position, scale, rotation, visibility, ordering, or alignment. Slot Properties do not mutate the intrinsic definition of the occupant.

## Overridable Property
A Property whose value can be replaced by a value supplied by a containing context while preserving the underlying entity definition.

## Modulatable Property
A Property whose value can be driven or varied by a modulation source. A modulatable Property may use a FRNL Curve where the property supports curve-based modulation.

## Slot Event
An Event belonging to the Slot boundary. At minimum, Slot Events include State Changed and Occupant Changed. Slot Events observe the live occupant without transferring State or Event ownership away from that occupant.

## State Changed
A Slot Event fired when the State of the UI Primitive or UI Composite currently occupying the Slot changes.

## Occupant Changed
A Slot Event fired when the UI Primitive or UI Composite occupying a Slot is replaced.

## Repeatable Slot Collection
A named collection of Slot instances whose cardinality can change at runtime. Instances can be added, removed, inserted, or reordered.

## Recursive composition
The rule that UI Composite Slots may contain UI Composites as well as UI Primitives. This allows Composites to nest without a fixed depth and supports hierarchies such as Page -> Section -> Form -> control.

## Addressability
The hierarchical naming mechanism used to access Slots and the entities occupying them.

## Flow
A coordination definition owned by a UI Composite. A Flow connects events from contained entities or Slot Events to actions, state changes, data operations, or external functions.

## Bounds
The geometric area occupied by a UI Primitive for interaction. Pointer interaction outside Bounds does not trigger the primitive's pointer events.

## Visual Asset
A rendered visual belonging to a UI Primitive. A primitive may contain multiple Visual Assets. Assets expose editable properties such as content, position, transform, opacity, tint, and other rendering properties.

## State
A named definition of semantic configuration and editable property values. UI Primitives and UI Composites may both define States. State values may be represented as static values or curves and are interpreted through Attack, Sustain, and Release phases. A Composite State does not own Visual Assets.

## Curve
A mapping over a canonical one-second domain. Curves do not define their own duration. Curves may drive modulatable Properties, including applicable Slot Properties.

## Phase
A temporal mode of State execution: Attack, Sustain, or Release.

## Event
A callable interaction or programmatic occurrence exposed by a UI Primitive. Standard categories include pointer/mouse events and keyboard events; custom events are also supported.

## Function
External application logic invoked by an Event or Flow. FRNL defines the invocation semantics, not application-specific business logic.

## Clipping
A per-Visual-Asset rendering option. When enabled, the asset is clipped to the UI Primitive's Bounds. Clipping does not affect the interaction boundary.
