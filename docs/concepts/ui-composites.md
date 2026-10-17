# UI Composites

A **UI Composite** is the structural and logical grouping entity in the Frnl UI model.

A Composite groups UI entities through named Slots, provides an addressable boundary for those entities, can define group-level Properties and States, and can define Flows that coordinate Events and actions across the group.

A Composite does **not** own Visual Assets.

## Core structure

A UI Composite consists of:

1. Slots
2. Properties
3. States
4. Flows

    UI Composite
    ├── Slots[]
    │   └── UI Primitive | UI Composite
    ├── Properties
    ├── States[]
    └── Flows[]

The absence of Visual Assets is intentional. Visual rendering belongs to UI Primitives. A Composite groups those visual/interactive entities rather than becoming another visual owner.

## Slots and recursive composition

Every Composite contains named Slots.

A Slot may contain either:

- a UI Primitive, or
- another UI Composite.

This is a foundational rule of FrnlTS. UI Composites are therefore **recursively nestable**, with no fixed maximum depth imposed by the semantic model.

    UI Composite
    ├── Slot -> UI Primitive
    ├── Slot -> UI Primitive
    └── Slot -> UI Composite
        ├── Slot -> UI Primitive
        └── Slot -> UI Composite
            └── ...

Recursion allows the same composition mechanism to represent every level of an application UI.

For example:

    Page
    └── UI Composite
        ├── Header -> UI Composite
        ├── Content -> UI Composite
        │   ├── Section -> UI Composite
        │   │   ├── Title -> UI Primitive
        │   │   └── Form -> UI Composite
        │   │       └── Submit -> UI Primitive
        │   └── Section -> UI Composite
        └── Footer -> UI Composite

Page, Section, Header, Form, Card, Toolbar, and similar names are application-level roles expressed through Composite definitions. They are not additional foundational entity types.

## Slot identity and addressability

A Slot has a stable name within its containing Composite.

The Composite exposes an addressable interface to the entities in its Slots. Nested entities can be addressed by composing Slot names through the hierarchy.

    Page.content
    Page.content.profileSection
    Page.content.profileSection.name

Addressability is semantic and renderer-independent. A runtime may implement it with references, handles, paths, or another mechanism, but the FRNL contract is that the hierarchy is addressable.

## Composite States

A UI Composite may define any number of named States.

Composite States use the same State and temporal semantics as Primitive States:

- Attack
- Sustain
- Release
- canonical one-second Curves
- phase-owned duration

A Composite State does not own Visual Assets.

Instead, it may represent group-level semantic configuration and coordinate Properties and/or States of entities in its Slots.

    LoginForm
    ├── default
    ├── submitting
    ├── error
    └── success

Any visual effect remains owned by the affected Primitive Visual Assets.

## Flows

A Flow is a coordination definition owned by a UI Composite.

Flows can connect:

- Events emitted by contained UI Primitives
- actions on contained entities
- Composite or child State changes
- data transformations or validation
- external function invocation
- subsequent steps in the same flow

The Primitive remains the owner of its Event. The Composite owns the relationship between that Event and the subsequent coordinated actions.

Example:

    LoginForm.submit.click
            ↓
    validate username
            ↓
    validate password
            ↓
    LoginForm -> submitting
            ↓
    invoke login function
            ↓
        ┌───────────────┴───────────────┐
      success                         failure
        ↓                               ↓
    success State                   error State

Flows provide frontend-level orchestration without moving application business logic into Primitive definitions or Visual Assets.

## Visual and logical grouping

A Composite provides two related forms of grouping.

### Visual grouping

The entities in its Slots form a structural UI region. The Composite itself does not own a rendered background, border, or other visual asset.

### Logical grouping

The same entities are grouped under a common address and can participate in Composite-level Flows and States.

    LoginForm
    ├── username -> Text Input
    ├── password -> Text Input
    ├── rememberMe -> Checkbox
    └── submit -> Button

    Flow
    └── submit.click
        ├── validate
        ├── submitting
        └── invoke login

## Responsibility boundaries

### UI Primitive owns

- Bounds
- Visual Assets
- Primitive Properties
- Primitive States
- Primitive Events
- Primitive-level interaction

### UI Composite owns

- Slots
- Hierarchical addressability
- Composite Properties
- Composite States
- Flows
- Coordination across contained entities

### UI Composite does not own

- Visual Assets
- Primitive Event definitions
- Renderer-specific implementation
- Application business logic embedded directly into the semantic definition

## Recursive Page -> Section pattern

A page is naturally a Composite, and each section can be another Composite.

    DashboardPage
    ├── header -> Header
    │   └── navigation -> Navigation
    ├── content -> Content
    │   ├── overview -> OverviewSection
    │   │   ├── title -> Text
    │   │   └── refresh -> Button
    │   └── activity -> ActivitySection
    │       └── list -> ActivityList
    └── footer -> Footer

Every named node above except atomic controls may itself be a UI Composite. The hierarchy can continue recursively.

This is the primary pattern for constructing larger UI structures from smaller ones.
