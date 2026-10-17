# Slots

A **Slot** is a named, addressable position inside a UI Composite that contains one UI entity at a time.

A Slot may contain either:

- a UI Primitive, or
- a UI Composite.

This makes Slots the mechanism through which recursive UI composition is expressed.

## Slot structure

    Composite
    ├── slot: header -> UI Composite
    ├── slot: title -> UI Primitive
    └── slot: actions -> UI Composite

The Slot name is unique within its containing Composite and forms part of the entity's address.

## Slot as a runtime boundary

A Slot is not merely a declaration-time placeholder. It is a live semantic boundary whose occupant can be changed while the containing UI is being rendered.

The identity of the Slot remains stable while its occupant changes.

For example:

    Page.content
        occupant = OverviewSection

    Page.content
        occupant = ActivitySection

The Slot itself remains `Page.content`; only the UI entity occupying it changes.

This allows a renderer/runtime to replace the UI Primitive or UI Composite in a Slot without reconstructing the containing Composite solely to change that Slot's occupant.

## Recursive nesting

A Composite Slot is not restricted to Primitives.

    Page
    └── content -> UI Composite
        ├── overview -> UI Composite
        │   ├── title -> UI Primitive
        │   └── actions -> UI Composite
        │       └── save -> UI Primitive
        └── activity -> UI Composite

This recursion has no fixed maximum depth in the semantic model.

The pattern allows larger structures to be built from the same mechanism:

- controls inside forms
- controls and forms inside sections
- sections inside pages
- pages inside application-level UI structures

No new foundational entity type is required for each hierarchy level.

## Slot properties

Slots expose **overridable Properties** that control the relationship between the Slot and its occupant.

These Properties are distinct from the occupant's own Properties.

Slot Properties are intended for basic layout and presentation adjustment without modifying the definition of the contained Primitive or Composite.

Examples include:

- position / translation
- size / scale
- rotation
- visibility
- ordering / stacking position
- alignment
- other renderer-independent layout relationship properties

The exact concrete property set is extensible; FRNL defines the semantic capability rather than prescribing a renderer-specific layout system.

Conceptually:

    Slot
    ├── occupant
    └── Properties
        ├── position
        ├── scale
        ├── rotation
        ├── visibility
        └── order

A Slot Property overrides the relationship of the occupant to its containing Composite. It does not mutate the occupant's intrinsic definition.

## Slot modulation and curves

Slot Properties may be **modulatable**.

A modulatable Slot Property can be driven by a Curve using the same canonical temporal semantics defined for other FRNL properties.

Every Curve has a canonical one-second domain.

Therefore a Slot can be animated without the contained UI Primitive or UI Composite owning the animation.

For example:

    Slot: panel
        position.x -> Curve
        scale      -> Curve
        rotation   -> Curve

The timing rules remain:

- Attack stretches or compresses the one-second Curve to the Attack duration.
- Sustain loops the Curve over its canonical one-second domain.
- Release stretches or compresses the one-second Curve to the Release duration.

This means Slot animation is a property-level capability, not a separate animation entity.

## Slot collections and dynamic count

A Composite may define a **repeatable Slot collection** when its UI structure requires a variable number of occupants.

A repeatable Slot collection represents a named family of Slot instances rather than a single fixed Slot.

For example:

    Page.items[0]
    Page.items[1]
    Page.items[2]

The collection may grow, shrink, insert, remove, or reorder Slot instances at runtime.

Each Slot instance has its own occupant, Slot Properties, and Slot Events.

Changing the count of a repeatable Slot collection therefore changes the number of UI entities participating in that part of the Composite without changing the Composite's foundational definition.

A single fixed Slot remains singular. Variable cardinality is expressed explicitly as a repeatable Slot collection rather than by silently changing the meaning of a fixed Slot.

## Slot Events

Each Slot has Events associated with its live occupant and lifecycle.

At minimum, the Slot Event model includes:

### State Changed

Fired when the State of the UI entity currently occupying the Slot changes.

This applies whether the occupant is:

- a UI Primitive, or
- a UI Composite.

Conceptually:

    Slot: submit
        occupant State
            pressed -> default
                ↓
        Slot.stateChanged

The event identifies the Slot and provides the relevant state transition information.

### Occupant Changed

Fired when the UI entity occupying the Slot is replaced.

For example:

    Slot: content
        OverviewSection
            ↓
        ActivitySection

causes:

    content.occupantChanged

The Slot remains the same semantic address; its occupant changes.

Occupant Changed is therefore distinct from State Changed. Replacing an entity is a Slot-level lifecycle event, not a state transition of the previous or new occupant.

### Slot-level events

Additional Slot Events may be defined for changes to Slot Properties, collection membership, or other Slot lifecycle conditions. They remain events of the Slot boundary rather than events owned by the contained Primitive or Composite.

## Real-time occupant replacement

The semantic model permits the occupant of a Slot to be changed while the UI is actively rendering.

A runtime must therefore be able to perform:

    Slot occupant
        old entity
            ↓ replace
        new entity

without requiring a semantic reconstruction of the parent Composite.

The replacement must preserve:

- the Slot's identity
- the Slot's address
- the Slot's own Properties
- the Slot's own Event interface

The new occupant becomes the entity represented at that Slot address.

The runtime is responsible for attaching/detaching the appropriate concrete rendering and interaction resources. FRNL only defines the semantic requirement that the Slot can change occupants during active rendering.

## Addressing

A Slot is addressable through its containing Composite.

For nested Slots, addresses are hierarchical:

    Page.content
    Page.content.overview
    Page.content.overview.actions
    Page.content.overview.actions.save

For repeatable Slot collections, the collection name and instance identity are part of the address:

    Page.items[0]
    Page.items[1]

The address identifies the Slot or entity occupying that Slot.

The exact runtime representation of an address is implementation-specific; FRNL defines the semantic hierarchy, not the runtime storage mechanism.

## Slot ownership

A Composite owns its Slots.

A Primitive does not own Slots.

A Composite may contain another Composite through a Slot without taking ownership of that nested Composite's internal Slot definitions. The nested Composite remains structurally responsible for its own children.

    Parent Composite
    └── Slot
        └── Child Composite
            ├── Slot
            ├── Slot
            └── ...

## Visual implications

A Slot is structural, not a Visual Asset.

Placing an entity into a Slot does not automatically create a background, border, clipping region, or other visual representation for the Composite.

Visual rendering is provided by the UI Primitives contained in the hierarchy.

Slot Properties may affect how the occupant is laid out, transformed, ordered, or presented within the containing Composite, but they do not make the Slot itself a Visual Asset.

## Logical implications

Because Slots establish a stable hierarchy, Composite Flows can address contained entities and Slot Events through their Slot paths.

    Page.form.submit.click
    Page.form.email.value
    Page.content.stateChanged
    Page.content.occupantChanged

These addresses are semantic references used by the Composite coordination model. They do not require a renderer-specific event or DOM model.
