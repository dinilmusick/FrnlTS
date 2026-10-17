# UI Primitive

## Definition

A **UI Primitive** is the fundamental atomic unit of the Frnl UI model. It represents a single interactive or visual UI entity as a structured collection of Bounds, Visual Assets, Properties, States, and Events.

A UI Primitive is renderer-agnostic: it describes what the element is, where it exists, what it looks like, how it changes, and how it can be invoked, while rendering and execution are handled by downstream systems.

A UI Primitive is not divided into separate input and non-input primitive types. Input capability is expressed through the primitive's properties and events.

## Core structure

A UI Primitive consists of:

1. Bounds
2. Visual Assets
3. Properties
4. States
5. Events

A Primitive can be placed into a named Slot of a UI Composite. It remains an atomic entity even when nested inside arbitrarily deep Composite hierarchies.

## Relationship to UI Composites

A UI Composite groups UI entities through named Slots. Each Slot may contain either a UI Primitive or another UI Composite.

This makes UI composition recursive:

    Page
    └── UI Composite
        ├── Header -> UI Composite
        ├── Content -> UI Composite
        │   ├── Section -> UI Composite
        │   │   └── control -> UI Primitive
        │   └── Section -> UI Composite
        └── Footer -> UI Composite

A Primitive remains the atomic visual/interactive unit at any depth. The Composite is responsible for grouping, addressability, group-level state, and Flows; it does not become a visual asset owner.

## Bounds

Bounds define the spatial and interactive extent of the UI primitive.

Pointer events such as hover and click are evaluated against Bounds. A visual asset may extend outside Bounds without extending the interactive area.

Bounds are not a rendered asset. They also provide the interaction region for input-capable primitives.

## Visual Assets

A UI primitive may contain multiple Visual Assets. Assets may be text, images, SVGs, colors, shapes, CSS-defined visual content, or other renderable forms.

Each asset has its own local origin and may be independently positioned, transformed, and clipped to the primitive's Bounds. Clipping is an asset-level rendering property, not an interaction boundary.

For input-capable primitives, editing indicators such as a blinking caret are Visual Assets.

## Properties

Properties are editable data exposed by a primitive and its constituent parts.

For example, a text-input primitive may expose value, focus/editing state, selection information, caret position, and input constraints. The property represents data; an event represents the occurrence that can read or modify that data.

## States

A State is a named collection of property values describing a configuration of the primitive.

A Primitive may define arbitrary named States such as default, hover, focused, pressed, disabled, and application-specific states.

Each State uses Attack, Sustain, and Release phases. Attack and Release have explicit durations; Sustain has no duration of its own.

## Curves and temporal properties

Overridable properties may be static values or Curves.

Every Curve has a canonical one-second domain. During Attack and Release, the curve is stretched or compressed to the phase duration. During Sustain, the curve repeats over its one-second domain.

Timing belongs to the phase; the Curve describes normalized property evolution.

## Events

Events are callable interaction or invocation points exposed by the Primitive.

Event categories include:

- Pointer events
- Keyboard/input events
- Focus/input-state events
- Custom events

Pointer events are evaluated against Bounds, not against individual Visual Assets.

Every event is callable through the Primitive event interface. An event can invoke external application functions rather than containing business logic itself.

## Examples

### Button

    Button
    ├── Bounds
    ├── Visual Assets
    ├── Properties
    ├── States
    └── Events

### Text input

    Text Input
    ├── Bounds
    ├── Visual Assets
    │   ├── text rendering
    │   └── caret rendering
    ├── Properties
    │   ├── value
    │   ├── focus/editing state
    │   └── selection/caret data
    ├── States
    │   ├── default
    │   ├── focused
    │   └── disabled
    └── Events
        ├── focus
        ├── blur
        ├── key/input events
        ├── change
        └── custom events

The text input is therefore not a second class of primitive. It is a UI Primitive whose properties and events happen to support text input.

## Design principle

The UI Primitive is a formal, renderer-independent description of an atomic UI element. The UI Composite is the formal grouping and coordination layer around such entities.

Neither entity requires Frnl to depend on a particular rendering engine, animation library, DOM implementation, or application framework.
