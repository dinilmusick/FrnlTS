# States

A State is a named definition of semantic configuration and editable property values.

Both UI Primitives and UI Composites may define States.

## UI Primitive States

For a UI Primitive, a State describes the primitive's editable property values and the configuration of its constituent parts.

## UI Composite States

A UI Composite State describes group-level semantic configuration for the Composite.

A Composite State does not own Visual Assets. It may coordinate or represent changes to properties and/or States of entities in its Slots, but the actual visual representation remains owned by the affected UI Primitives.

A Composite State may also affect Slot Properties. This allows a group state to change or animate the layout relationship of contained entities without giving the Composite its own Visual Assets.

For example:

    LoginForm
    ├── State: submitting
    │   ├── coordinate child states
    │   ├── change submit Slot visibility/transform
    │   └── represent form-level submission status
    └── no Visual Assets owned by LoginForm

## Slot State Events

Because a Slot has its own Event boundary, a state transition of the entity occupying a Slot can produce a Slot-level State Changed event.

This does not transfer State ownership to the Slot.

    UI Primitive / UI Composite
            │
            └── State changes
                    ↓
                Slot.stateChanged

The entity remains the owner of its State; the Slot observes and exposes the Slot-level event.

## Temporal semantics

State does not own Curve duration. Curves have a canonical one-second domain, while Attack and Release phases provide finite durations and Sustain loops the one-second domain.

A State contains Attack property definitions, Sustain property definitions, and Release property definitions.

Those definitions may contain static values or Curves for editable properties, including applicable Slot Properties.

A UI entity may define any number of States.

The framework should not prescribe a fixed whitelist of State properties. Any editable property represented by the entity can participate in a State.
