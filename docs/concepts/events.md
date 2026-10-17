# Events

Events belong to UI Primitives.

A UI Primitive owns its Events. Events are callable interaction or programmatic occurrences exposed by that Primitive.

## Standard event categories

FRNL supports event concepts based on pointer/mouse interaction, such as hover and click; keyboard input, including keyboard presses and linked hotkeys; focus/input-state events; and custom programmatic events.

Pointer interaction is evaluated against the Primitive's Bounds, not against individual Visual Assets.

## Events and Composites

A UI Composite does not take ownership of the contained Primitive's Events. Instead, the Composite can reference and consume those Events in its Flows.

Conceptually:

    Primitive Event
        ↓
    Composite Flow
        ↓
    action / state change / external function

This separation keeps event ownership at the Primitive level while allowing Composites to coordinate multiple entities.

## Callable events

Every Primitive event exposes a callable interface that can invoke external application functions.

Custom events can be triggered by code against a UI Primitive and can invoke their registered function(s).

FRNL defines the event semantics and interface. The application owns the implementation of the functions invoked by events.
