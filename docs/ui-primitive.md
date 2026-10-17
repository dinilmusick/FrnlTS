# UI Primitive

## Definition

A **UI primitive** is the fundamental declarative unit of the Frnl UI model. It represents a single interactive or visual UI element as a structured collection of geometry, visual assets, state, and events.

A UI primitive is renderer-agnostic: it describes **what the element is, where it exists, what it looks like, how it changes, and how it can be invoked**, while rendering and execution are handled by downstream systems.

## Core structure

A UI primitive consists of:

1. **Bounds**
2. **Visual assets**
3. **States**
4. **Events**

### 1. Bounds

Bounds define the spatial and interactive extent of the UI primitive.

The primitive has a local origin/center, and its bounds describe the area occupied by the primitive relative to that origin.

Bounds are the authoritative **hit area** for primitive-level interaction:
- Pointer events such as hover and click are evaluated against the bounds.
- A visual asset may extend outside the bounds.
- Extending outside the bounds does not extend the interactive area.
- Bounds therefore separate **visual extent** from **interaction extent**.

Bounds are not themselves a rendered asset.

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

### 3. States

A state is a named collection of property values describing a particular configuration of the UI primitive.

A state does not need a separately invented schema of properties. Instead, it contains the editable/overridable properties exposed by the primitive and its constituent visual assets.

This allows a primitive to have arbitrary named states such as:
- default
- hover
- pressed
- disabled
- application-specific states

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

### 4. Curves and temporal properties

Overridable visual properties may be represented either as a value or as a curve.

A curve is a normalized lookup/function describing how a property changes over a canonical one-second domain.

The curve itself therefore does not carry an attack/release duration.

Instead:
- During **attack**, the one-second curve is stretched or compressed to fit the attack duration.
- During **release**, the one-second curve is stretched or compressed to fit the release duration.
- During **sustain**, the one-second curve repeats/loops continuously because sustain has no fixed duration.

Thus, timing belongs to the phase, while the curve describes the normalized evolution of a property.

### 5. Events

Events are callable interaction or invocation points exposed by the UI primitive.

Events are defined independently from visual assets. A primitive's visual assets do not each need their own event system.

Event categories include:
- **Pointer events** — e.g. hover, click
- **Keyboard/input events** — e.g. a linked hotkey being pressed
- **Custom events** — externally invoked events carrying whatever input/payload the event contract requires

Pointer events are evaluated against the primitive's bounds, not against the visible pixels of assets that happen to extend outside those bounds.

Every event is callable through the UI primitive's event interface.

An event does not have to contain its business logic. Instead, an event can invoke a function elsewhere in the application/codebase. This keeps the primitive declarative and separates UI invocation from application behavior.

## Conceptual model

```text
UI Primitive
├── Bounds
├── Visual Assets[]
│   └── overridable / animatable visual properties
├── States[]
│   ├── Attack
│   ├── Sustain
│   └── Release
└── Events[]
    └── callable functions
```

The resulting model separates four concerns:

```text
Bounds        → Where the primitive exists and receives interaction
Visual Assets → What the primitive renders
States        → What configurations the primitive can assume
Events        → How the primitive can be invoked
Curves/Phases → How state properties evolve over time
```

## Design principle

The UI primitive is a **formal, renderer-independent description of a UI element**.

It should remain sufficiently abstract that Frnl can describe the primitive without depending on a particular rendering engine, animation library, DOM implementation, or application framework.

Downstream systems can then interpret the primitive for their specific runtime while preserving the same semantic model.