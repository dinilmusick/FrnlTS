# Events

FRNL has two event ownership levels:

- **UI Primitive Events** belong to UI Primitives.
- **Slot Events** belong to Slots.

UI Composites consume these events through Flows but do not take ownership of Primitive Events.

## Primitive Events

A UI Primitive owns its Events. Events are callable interaction or programmatic occurrences exposed by that Primitive.

FRNL supports event concepts based on pointer/mouse interaction, such as hover and click; keyboard input, including keyboard presses and linked hotkeys; focus/input-state events; and custom programmatic events.

Pointer interaction is evaluated against the Primitive's Bounds, not against individual Visual Assets.

## Slot Events

A Slot has its own Event boundary because the Slot is a live container whose occupant can change during rendering.

At minimum, every Slot supports:

### State Changed

Fired when the State of the UI Primitive or UI Composite currently occupying the Slot changes.

State ownership remains with the occupant. The Slot observes the transition and exposes it as a Slot Event.

### Occupant Changed

Fired when the UI Primitive or UI Composite occupying the Slot is replaced.

The Slot remains the same semantic entity while the occupant changes.

    Slot: content
        OverviewSection
            ↓
        ActivitySection

    content.occupantChanged

Additional Slot Events may be defined for Slot Property changes, repeatable Slot collection membership, or other Slot lifecycle conditions.

## Events and Composites

A UI Composite does not take ownership of the contained Primitive's Events. Instead, the Composite can reference and consume Primitive Events and Slot Events in its Flows.

Conceptually:

    Primitive Event ─┐
                    ├──> Composite Flow
    Slot Event ──────┘
                           ↓
                action / state change / external function

This separation keeps source-event ownership clear while allowing Composites to coordinate multiple entities.

## Callable events

Every Primitive event exposes a callable interface that can invoke external application functions.

Slot Events expose a callable event interface to the containing Composite's Flow system.

Custom events can be triggered by code against a UI Primitive or, where defined, a Slot.

FRNL defines the event semantics and interface. The application owns the implementation of the functions invoked by events.

## Event payload validation

Event payloads are runtime-validated with **Zod**. Each framework-defined event has a corresponding Zod payload schema, and emitted payloads must satisfy that schema before entering the event stream.

This applies to Primitive Events, Slot Events, and framework-defined programmatic event payloads. TypeScript types remain the compile-time representation of the same contracts.
