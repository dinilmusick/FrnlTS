# Events

Events belong to the UI Primitive.

## Standard event categories

FRNL supports event concepts based on pointer/mouse interaction, such as hover and click; keyboard input, including keyboard presses and linked hotkeys; and custom programmatic events.

Pointer interaction is evaluated against the primitive's Bounds, not against individual Visual Assets.

## Callable events

Every event exposes a callable interface that can invoke external application functions.

The UI Primitive can therefore expose a stable event interface without embedding application-specific business logic inside the primitive.

Custom events can be triggered by code against a UI Primitive and can invoke their registered function(s).

FRNL defines the event semantics and interface. The application owns the implementation of the functions invoked by events.
