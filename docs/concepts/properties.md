# Properties

FRNL treats editable properties as first-class data.

A property may hold a static value or a Curve.

The exact set of properties is extensible. The framework should not prematurely constrain State to a fixed property whitelist.

Properties may belong to Bounds, Visual Assets, or other editable parts of a UI Primitive. UI Composites may also expose editable Properties for group-level semantic configuration.

State can therefore represent editable configuration without requiring a separate hard-coded state-property schema.

A Composite Property does not become a Visual Asset. Visual representation remains owned by contained UI Primitives.
