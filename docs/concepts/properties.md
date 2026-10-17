# Properties

FRNL treats editable properties as first-class data.

A property may hold a static value or a Curve.

Properties can be **overridable** and, where the semantic type permits, **modulatable**.

- **Overridable** means a value defined at a lower-level entity can be replaced by a value supplied by its containing context.
- **Modulatable** means the property's value can be driven over time or otherwise varied by a modulation source defined by the semantic contract.

The exact set of properties is extensible. The framework should not prematurely constrain State to a fixed property whitelist.

## Primitive and constituent properties

Properties may belong to Bounds, Visual Assets, or other editable parts of a UI Primitive.

For example, Visual Asset properties can be overridden and can use Curves for normalized temporal evolution.

## Slot properties

A UI Composite's Slots also expose Properties.

Slot Properties describe the relationship between the Slot and its occupant rather than the intrinsic definition of the occupant.

Typical Slot Properties include basic layout and transformation controls such as:

- position / translation
- size / scale
- rotation
- visibility
- ordering
- alignment

Slot Properties are therefore a semantic layout boundary. They let a parent Composite adjust an occupant without modifying the occupant's reusable definition.

Slot Properties may be overridable and modulatable. A modulatable Slot Property can use a Curve with the same canonical one-second domain and Attack/Sustain/Release timing semantics used elsewhere in FRNL.

For example, a Slot's position, scale, or rotation can be animated independently of the contained UI Primitive or UI Composite.

## Composite properties

UI Composites may expose Properties for group-level semantic configuration.

A Composite Property does not become a Visual Asset. Visual representation remains owned by contained UI Primitives.

## State interaction

States may contain values for Properties that the entity exposes.

For a Composite, a State may therefore affect Composite Properties or coordinate child Properties and States.

A Slot Property can participate in the same state/curve system, allowing a Composite State to alter or animate layout relationships without making the Composite itself a Visual Asset owner.

The property remains data; an Event represents an occurrence that can read or modify it; a Flow can coordinate those changes.
