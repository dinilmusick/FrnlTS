# FrnlTS (@dinilmusick/frnlts)

> A semantic frontend runtime for ordinary React components.

FrnlTS does not wrap React components in primitive/composite classes, renderer classes, or adapter component hierarchies. The React component is the component. FrnlTS attaches state, state-resolved events, visual definitions, themes, slots, flows, and runtime lifecycle machinery to that component.

## Architectural role

FrnlTS supplies frontend semantics and runtime machinery. Floks supplies concrete React UI components. Applications compose those ordinary React components.

```text
React component
    │
    ├── normal React props/rendering
    ├── useFrnlComponent()
    │      ├── Frnl state
    │      ├── state-resolved events
    │      ├── visual parameters
    │      └── component scope
    └── FrnlSlot where structural composition is required
             │
             ▼
        Zustand-backed runtime
```

There is one component model. A component may render children, use slots, participate in flows, or be nested in another component without acquiring a second runtime class.

## Core semantic model

- **React components** are the concrete UI entities.
- **States** own state-local events, visual parameters, and Attack/Sustain/Release definitions.
- **Events** resolve against the component's current state before invoking the registered handler.
- **Slots** are stable addressable layout/replacement boundaries for rendered component content.
- **Flows** coordinate events, state changes, slot changes, data, and external functions.
- **Themes** provide optional visual parameter overrides for named components and states.
- **Libraries** provide centrally addressable component/application functions and data.

## Direct React integration

Use `useFrnlComponent()` inside the actual React component:

```tsx
const frnl = useFrnlComponent({
  id,
  definition,
  store,
  state: 'idle',
  handlers,
});

return <button onClick={() => frnl.events.click()}>{children}</button>;
```

The hook registers the component with the Frnl runtime and cleans it up when the React component unmounts. No Frnl wrapper object or rendering class is required.

## Event resolution

Every input path should converge on the same semantic event:

```text
React input / keyboard / application code / another component
                         ↓
                  component event
                         ↓
                  current state
                         ↓
                  state.events[event]
                         ↓
                   functionId
                         ↓
                    handler
```

The input source does not directly own the handler implementation.

## Slots

`FrnlSlot` is a React component backed by the same store. It provides a stable address, slot properties, occupant replacement, and slot lifecycle events without wrapping the occupant component.

## Themes

Theme values are resolved in this order:

```text
State visual parameters
        ↓
Theme visual parameters
        ↓
Surgical instance overrides
```

Applying a theme and changing state clear surgical overrides while preserving the selected theme.

## Runtime validation

External semantic inputs and runtime mutations cross Zod validation boundaries before entering the Zustand runtime.

## Package exports

- `@dinilmusick/frnlts` — semantic runtime and component contracts.
- `@dinilmusick/frnlts/runtime` — headless runtime.
- `@dinilmusick/frnlts/react` — `useFrnlComponent` and `FrnlSlot`.

Concrete UI remains ordinary React code.
