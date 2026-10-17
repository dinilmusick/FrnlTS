# Slots

A **Slot** is a named position inside a UI Composite that contains one UI entity.

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

The pattern allows larger structures to be built from the same primitive:

- controls inside forms
- controls and forms inside sections
- sections inside pages
- pages inside application-level UI structures

No new foundational entity type is required for each hierarchy level.

## Addressing

A Slot is addressable through its containing Composite.

For nested Slots, addresses are hierarchical:

    Page.content
    Page.content.overview
    Page.content.overview.actions
    Page.content.overview.actions.save

The address identifies the entity occupying the Slot.

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

## Logical implications

Because Slots establish a stable hierarchy, Composite Flows can address contained entities through their Slot paths.

    Page.form.submit.click
    Page.form.email.value
    Page.content.refresh.click

These addresses are semantic references used by the Composite coordination model. They do not require a renderer-specific event or DOM model.
