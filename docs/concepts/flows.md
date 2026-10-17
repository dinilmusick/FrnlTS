# Flows

A **Flow** is a coordination definition owned by a UI Composite.

Flows express relationships and sequencing between events, actions, state changes, data operations, and external functions across the entities contained by the Composite.

Flows are the frontend analogue of orchestration: they coordinate existing UI entities rather than redefining those entities.

## Ownership

The UI Primitive owns its Events.

The UI Composite owns Flows that may consume those Events.

    UI Primitive
    └── Event: submit.click
            ↓
    UI Composite
    └── Flow
        ├── validate
        ├── change state
        └── invoke external function

A Flow does not transfer ownership of the Event from the Primitive to the Composite.

## Flow inputs

A Flow may be triggered by:

- an Event from a contained UI Primitive
- an Event or action exposed by a nested UI Composite
- an explicit programmatic invocation
- another Flow step, where the flow contract permits chaining

Nested entities can be referenced through Slot paths.

## Flow actions

A Flow may coordinate:

- reading or updating Properties
- changing a Primitive or Composite State
- invoking an Event or callable interface
- invoking an external function
- validating or transforming data
- continuing to subsequent Flow steps
- branching according to a result

FRNL defines the semantic coordination model. Application-specific business logic remains external to the semantic UI definition.

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

A Flow can cause a state or property change that ultimately changes Primitive Visual Assets, but the Flow itself has no Visual Asset.

This preserves the separation:

    Primitive -> visual + interaction
    Composite -> structure + coordination
    Flow     -> event/action sequencing
