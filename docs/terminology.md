# FRNL-TS Terminology

## Component
An ordinary React component with Frnl state and event machinery attached through `useFrnlComponent()`. It is the single UI entity model in FrnlTS.

## State
A named component configuration containing state-local Events, visual parameters, and Attack/Sustain/Release definitions.

## Event
A callable semantic occurrence resolved against a component's current State before invoking its registered handler.

## Semantic Parent
A Frnl component may reference another component as its semantic parent for event addressing. This relationship does not control React children or layout.

## Flow
Frontend orchestration that coordinates component Events, Slot Events, state changes, properties, data, and external functions.

## Theme
Named visual data applied to component instances. Theme values override state visual parameters while surgical instance overrides remain highest priority.

## Function
Application or library logic invoked by an Event or Flow. FrnlTS defines invocation semantics, not business logic.

## Visual Asset
Renderer-facing visual data associated with a component or state. FrnlTS defines semantic visual parameters; ordinary React rendering remains responsible for producing pixels.

## Curve
A normalized one-second value domain used by modulatable properties.

## Phase
A temporal mode of State execution: Attack, Sustain, or Release.

## Clipping
A rendering concern controlled by the concrete React/UI implementation, not a second Frnl component type.
