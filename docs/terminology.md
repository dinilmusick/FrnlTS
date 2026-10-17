# FRNL-TS Terminology

## UI Primitive
The basic reusable UI unit defined using FRNL semantics. Examples include Button, Text Input, Checkbox, and Text.

## Bounds
The geometric area occupied by a UI Primitive for interaction. Pointer interaction outside Bounds does not trigger the primitive's pointer events.

## Visual Asset
A rendered visual belonging to a UI Primitive. A primitive may contain multiple Visual Assets. Assets expose editable properties such as content, position, transform, opacity, tint, and other rendering properties.

## State
A named definition of the editable property values of a UI Primitive. State values may be represented as static values or curves and are interpreted through Attack, Sustain, and Release phases.

## Curve
A mapping over a canonical one-second domain. Curves do not define their own duration.

## Phase
A temporal mode of State execution: Attack, Sustain, or Release.

## Event
A callable interaction or programmatic occurrence exposed by a UI Primitive. Standard categories include pointer/mouse events and keyboard events; custom events are also supported.

## Function
External application logic invoked by an Event. FRNL defines the event interface, not application-specific business logic.

## Clipping
A per-Visual-Asset rendering option. When enabled, the asset is clipped to the UI Primitive's Bounds. Clipping does not affect the interaction boundary.
