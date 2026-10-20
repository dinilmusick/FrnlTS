# FrnlTS (@ultrst-armada/frnlts)

> A semantic frontend runtime for ordinary React components, with integrated workspace validation and CLI tooling.

FrnlTS does not wrap React components in semantic classes, renderer classes, or adapter component hierarchies. The React component is the component. FrnlTS attaches state, state-resolved events, visual definitions, themes, flows, and runtime lifecycle machinery to that component.

## Architectural role

FrnlTS supplies frontend semantics, runtime machinery, validation, and developer tooling. Floks supplies concrete React UI components. Applications compose those ordinary React components.

```text
React component
    ├── normal React props/rendering
    ├── useFrnlComponent()
    │      ├── Frnl state
    │      ├── state-resolved events
    │      ├── visual parameters
    │      └── component scope
    └── normal React composition
             ↓
        Zustand-backed runtime
```

## Core semantic model

- **React components** are the concrete UI entities.
- **States** own state-local events, visual parameters, and Attack/Sustain/Release definitions.
- **Events** resolve against the component's current state before invoking the registered handler.
- **Flows** coordinate events, state changes, slot changes, data, and external functions.
- **Themes** provide optional visual parameter overrides for named components and states.
- **Libraries** provide centrally addressable component/application functions and data.

## Page orchestration

Pages are application scope, not a second component hierarchy. FrnlTS defines the page orchestration contract; Skipo owns application composition and resolves concrete page components from Floks.

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

## Package layout

Only **`@ultrst-armada/frnlts`** is published. Validation and CLI code live in this repository and ship inside the same npm package, following the single-root-package distribution model.

| Import / command | Purpose |
|---|---|
| `@ultrst-armada/frnlts` | Main framework API |
| `@ultrst-armada/frnlts/react` | `useFrnlComponent` and direct React integration |
| `@ultrst-armada/frnlts/runtime` | Headless runtime |
| `@ultrst-armada/frnlts/validate` | Workspace validation API |
| `@ultrst-armada/frnlts/cli` | CLI programmatic API |
| `frnl` | Installed command-line executable |

The internal `packages/validate` and `packages/cli` workspace projects are not separately published.

## CLI

After installing FrnlTS, use the `frnl` executable:

```bash
frnl validate
frnl build
frnl dev
frnl watch
frnl generate component Button --state=idle --event=click
frnl generate page Home
```

## Runtime validation

External semantic inputs and runtime mutations cross Zod validation boundaries before entering the Zustand runtime.

## Development

```bash
pnpm install --frozen-lockfile
pnpm run build
pnpm run typecheck
pnpm run test
pnpm run validate
```

Concrete UI components remain ordinary React code and belong in Floks.
