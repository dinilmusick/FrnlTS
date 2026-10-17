# States

A State is a named definition of semantic configuration and editable property values.

Both UI Primitives and UI Composites may define States.

## UI Primitive States

For a UI Primitive, a State describes the primitive's editable property values and the configuration of its constituent parts.

## UI Composite States

A UI Composite State describes group-level semantic configuration for the Composite.

A Composite State does not own Visual Assets. It may coordinate or represent changes to properties and/or States of entities in its Slots, but the actual visual representation remains owned by the affected UI Primitives.

For example:

    LoginForm
    ├── State: submitting
    │   ├── coordinate username/password controls
    │   ├── coordinate submit control state
    │   └── represent form-level submission status
    └── no Visual Assets owned by LoginForm

A Composite State may use the same Attack, Sustain, and Release semantics as a Primitive State.

## Temporal semantics

State does not own Curve duration. Curves have a canonical one-second domain, while Attack and Release phases provide finite durations and Sustain loops the one-second domain.

A State contains Attack property definitions, Sustain property definitions, and Release property definitions.

Those definitions may contain static values or Curves for editable properties.

A UI entity may define any number of States.

The framework should not prescribe a fixed whitelist of State properties. Any editable property represented by the entity can participate in a State.
