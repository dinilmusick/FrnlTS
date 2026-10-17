# States

A State is a named definition of editable property values for a UI Primitive.

State does not own Curve duration. Curves have a canonical one-second domain, while Attack and Release phases provide finite durations and Sustain loops the one-second domain.

A State contains Attack property definitions, Sustain property definitions, and Release property definitions.

Those definitions may contain static values or Curves for editable properties.

A UI Primitive may define any number of States.

The framework should not prescribe a fixed whitelist of State properties. Any editable property represented by the primitive can participate in a State.
