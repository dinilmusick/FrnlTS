# UI Primitive

## Definition

A **UI primitive** is the fundamental declarative unit of the Frnl UI model. It represents a single interactive or visual UI element as a structured collection of geometry, visual assets, properties, state, and events.

A UI primitive is renderer-agnostic: it describes **what the element is, where it exists, what it looks like, how it changes, and how it can be invoked**, while rendering and execution are handled by downstream systems.

A UI primitive is **not divided into separate input and non-input primitive types**. Input capability is expressed through the primitive's properties and events. A button, text input, checkbox, slider, and similar controls therefore share the same fundamental model.

## Core structure

A UI primitive consists of:

1. **Bounds**
2. **Visual assets**
3. **Properties**
4. **States**
5. **Events**

### 1. Bounds

Bounds define the spatial and interactive extent of the UI primitive.

The primitive has a local origin/center, and its bounds describe the area occupied by the primitive relative to that origin.

Bounds are the authoritative **hit area** for primitive-level interaction:

- Pointer events such as hover and click are evaluated against the bounds.
- A visual asset may extend outside the bounds.
- Extending outside the bounds does not extend the interactive area.
- Bounds therefore separate **visual extent** from **interaction extent**.

Bounds are not themselves a rendered asset.

Bounds also provide the interaction region for input-capable primitives. For example, clicking inside a text-input primitive's bounds can establish focus so that subsequent keyboard input is directed to that primitive.

### 2. Visual assets

A UI primitive may contain multiple visual assets.

A visual asset is any declarative visual representation that can be rendered. Examples include images, SVGs, text, colors, shapes, CSS-defined visual content, and other renderer-supported visual content.

Each visual asset has its own local origin and is positioned relative to the UI primitive's origin. Assets may therefore be independently transformed and composed.

Visual assets expose properties that can be overridden and animated, including, as applicable:

- position / translation
- scale
- rotation
- opacity
- tint / color
- visual content itself
- other renderer-independent visual properties

A visual asset may also define whether it is **clipped** to the UI primitive's bounds. Clipping is an asset-level rendering property, not a bounds-level interaction property.

Multiple assets can overlap, extend beyond the bounds, and be transformed independently. Their rendering order/composition is part of the visual representation, while interaction remains governed by the primitive's bounds.

For an input-capable primitive, editing indicators are also visual assets. For example, a text-input primitive may render a blinking caret as a visual asset while the input value and focus state are represented by properties/state.

### 3. Properties

Properties are the editable data exposed by a UI primitive and its constituent parts.

FRNL does not create a separate structural category for input primitives. Instead, an input-capable primitive simply exposes the properties required for its interaction.

For example, a text-input primitive may expose:

- a current text/value property
- focus/editing state
- selection information
- caret position
- input constraints or configuration

These are ordinary primitive properties. They can participate in states and can cause visual assets to update.

The important distinction is:

**The property represents the data; the event represents the occurrence that can read or modify that data.**

Thus, keyboard input can modify a primitive's value property without requiring a special primitive type.

### 4. States

A state is a named collection of property values describing a particular configuration of the UI primitive.

A state does not need a separately invented schema of properties. Instead, it contains the editable/overridable properties exposed by the primitive and its constituent visual assets.

This allows a primitive to have arbitrary named states such as:

- default
- hover
- focused
- pressed
- disabled
- application-specific states

Input-capable primitives naturally use states such as **focused** or **editing** without becoming a different kind of UI primitive.

The exact properties available in a state are determined by the primitive's structure.

#### State phases

Each state is composed of three phases:

- **Attack**
- **Sustain**
- **Release**

The three phases together define the temporal evolution of the state.

**Attack** describes the transition into the state.

**Sustain** describes the continuing behavior while the state is active.

**Release** describes the transition out of the state.

Attack and release have explicit durations. Sustain has no duration of its own.

### 5. Curves and temporal properties

Overridable visual properties may be represented either as a value or as a curve.

A curve is a normalized lookup/function describing how a property changes over a canonical one-second domain.

The curve itself therefore does not carry an attack/release duration.

Instead:

- During **attack**, the one-second curve is stretched or compressed to fit the attack duration.
- During **release**, the one-second curve is stretched or compressed to fit the release duration.
- During **sustain**, the one-second curve repeats/loops continuously because sustain has no fixed duration.

Thus, timing belongs to the phase, while the curve describes the normalized evolution of a property.

### 6. Events

Events are callable interaction or invocation points exposed by the UI primitive.

Events are defined independently from visual assets. A primitive's visual assets do not each need their own event system.

Event categories include:

- **Pointer events** — e.g. hover, click
- **Keyboard/input events** — e.g. key press, key release, text input
- **Focus/input-state events** — e.g. focus gained, focus lost
- **Custom events** — externally invoked events carrying whatever input/payload the event contract requires

Pointer events are evaluated against the primitive's bounds, not against the visible pixels of assets that happen to extend outside those bounds.

For an input-capable primitive, the normal flow is:

```text
Pointer interaction inside Bounds
        ↓
Primitive receives focus
        ↓
Keyboard/input events are routed to the primitive
        ↓
Primitive properties are read/modified
        ↓
State / Visual Assets reflect the new values
```

For example, a text-input primitive can receive a key/text-input event and update its value property. Its visual assets can then render the updated text and caret.

Every event is callable through the UI primitive's event interface.

An event does not have to contain its business logic. Instead, an event can invoke a function elsewhere in the application/codebase. This keeps the primitive declarative and separates UI invocation from application behavior.

## Conceptual model

```text
UI Primitive
├── Bounds
│   └── interaction / hit area
├── Visual Assets[]
│   └── overridable / animatable visual properties
├── Properties
│   └── primitive data, including optional input data
├── States[]
│   ├── Attack
│   ├── Sustain
│   └── Release
└── Events[]
    └── callable functions
```

The resulting model separates the concerns:

```text
Bounds        → Where the primitive exists and receives interaction
Visual Assets → What the primitive renders
Properties    → What data the primitive exposes
States        → What configurations the primitive can assume
Events        → How the primitive can be invoked
Curves/Phases → How state properties evolve over time
```

## Example: button

A button does not require a special structural model.

```text
Button
├── Bounds
├── Visual Assets
├── Properties
│   └── e.g. disabled
├── States
│   ├── default
│   ├── hover
│   └── pressed
└── Events
    ├── hover
    ├── click
    └── hotkey
```

## Example: text input

A text input uses exactly the same primitive model.

```text
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
```

The text input is therefore not a second class of primitive. It is a UI primitive whose properties and events happen to support text input.

## Design principle

The UI primitive is a **formal, renderer-independent description of a UI element**.

It should remain sufficiently abstract that Frnl can describe the primitive without depending on a particular rendering engine, animation library, DOM implementation, or application framework.

Downstream systems can then interpret the primitive for their specific runtime while preserving the same semantic model.