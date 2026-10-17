# Flows

A **Flow** is a coordination definition owned by a UI Composite.

Flows express relationships and sequencing between events, actions, state changes, data operations, and external functions across the entities contained by the Composite.

Flows are the frontend analogue of orchestration: they coordinate existing UI entities rather than redefining those entities.

## Ownership

The UI Primitive owns its Events.

A UI Composite owns its Flows.

A Slot also exposes Slot Events for lifecycle and occupant-level observations. These events belong to the Slot boundary, not to the contained Primitive or Composite.

    UI Primitive
    └── Event: submit.click
            ↓
    UI Composite
    └── Flow
        ├── validate
        ├── change state
        └── invoke external function

    Slot
    └── Event: occupantChanged
            ↓
        Composite Flow

A Flow does not transfer ownership of an Event from its source to the Composite.

## Flow inputs

A Flow may be triggered by:

- an Event from a contained UI Primitive
- a Slot Event
- an Event or action exposed by a nested UI Composite
- an explicit programmatic invocation
- another Flow step, where the flow contract permits chaining

Slot Events include, at minimum:

- State Changed — the entity occupying the Slot changed State
- Occupant Changed — the UI Primitive or UI Composite occupying the Slot was replaced

## Flow actions

A Flow may coordinate:

- reading or updating Properties
- changing a Primitive or Composite State
- changing a Slot occupant
- changing Slot Properties
- changing the count or membership of a repeatable Slot collection
- invoking an Event or callable interface
- invoking an external function
- validating or transforming data
- continuing to subsequent Flow steps
- branching according to a result

FRNL defines the semantic coordination model. Application-specific business logic remains external to the semantic UI definition.

## Real-time Slot replacement

Because a Slot can change its occupant during active rendering, a Flow may perform a Slot occupant replacement as a runtime action.

For example:

    DashboardPage.content.occupantChanged
            ↓
    choose next content
            ↓
    DashboardPage.content <- ActivitySection

The replacement preserves the Slot's identity and address while changing the entity represented there.

The semantic model does not require the parent Composite itself to be reconstructed to perform this replacement.

## Example

    LoginForm.submit.click
            ↓
    read username.value
            ↓
    validate username
            ↓
    read password.value
            ↓
    validate password
            ↓
    set LoginForm State = submitting
            ↓
    invoke login(username, password)
            ↓
        ┌───────────────┴───────────────┐
      success                         failure
        ↓                               ↓
    State = success                 State = error

The exact execution/runtime representation of a Flow is implementation-specific.

## Nested Composites

Because Composites can contain Composites, Flows can coordinate entities across recursive boundaries.

For example:

    DashboardPage
    └── content
        └── profileSection
            └── form
                └── submit

A containing Composite may address an event through its hierarchy:

    DashboardPage.content.profileSection.form.submit.click

A nested Composite may also expose its own semantic Events or callable interface to its parent. This allows each Composite to encapsulate internal coordination while still participating in a larger Flow.

The exact public surface exposed by a Composite should be defined by its semantic contract; internal child details need not always be exposed.

## Visual independence

Flows do not render anything.

A Flow can cause a state or property change that ultimately changes Primitive Visual Assets or Slot layout properties, but the Flow itself has no Visual Asset.

This preserves the separation:

    Primitive -> visual + interaction
    Slot     -> occupant + layout relationship + Slot Events
    Composite -> structure + coordination
    Flow     -> event/action sequencing

## Flow input validation

Flow inputs, injected payloads, and data crossing a framework semantic boundary are validated with **Zod** before the Flow consumes them. A Flow must not treat an unvalidated external payload as a valid semantic input.

The exact schema is part of the Flow or callable contract. Invalid input is rejected at the boundary.
