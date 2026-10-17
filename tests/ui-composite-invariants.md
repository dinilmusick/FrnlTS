# UI Composite Semantic Invariants

This document is the validation test specification for the recursive UI Composite model.

A documentation/runtime implementation is considered inconsistent if any invariant below is violated.

## Invariants

1. FRNL has exactly two first-class UI entity categories in this model: UI Primitive and UI Composite.
2. Every UI Composite has named Slots.
3. Every Slot contains exactly one UI entity.
4. A Slot may contain a UI Primitive.
5. A Slot may contain a UI Composite.
6. Because Composite Slots may contain Composites, Composite nesting is recursive.
7. FRNL does not impose a fixed maximum Composite nesting depth.
8. A Composite does not own Visual Assets.
9. Primitive Events remain owned by their Primitive even when referenced by a Composite Flow.
10. Composite Flows may coordinate events, actions, state changes, data operations, and external functions.
11. Composite States do not own Visual Assets.
12. Composite States use the same Attack, Sustain, Release and Curve timing semantics as Primitive States.
13. Slot names establish hierarchical semantic addresses for contained entities.
14. Page -> Section -> nested Composite is a valid composition pattern without introducing a new foundational entity type.
15. Renderer-specific implementation details are not part of the FRNL semantic contract.

## Representative structural assertion

The following hierarchy must be semantically valid:

    DashboardPage (UI Composite)
    ├── header -> Header (UI Composite)
    │   └── navigation -> Navigation (UI Composite)
    │       ├── home -> Button (UI Primitive)
    │       └── settings -> Button (UI Primitive)
    ├── content -> Content (UI Composite)
    │   ├── overview -> Section (UI Composite)
    │   │   ├── title -> Text (UI Primitive)
    │   │   └── refresh -> Button (UI Primitive)
    │   └── activity -> Section (UI Composite)
    │       └── list -> ActivityList (UI Composite)
    └── footer -> Footer (UI Composite)

The following addresses must therefore be representable by the semantic hierarchy:

    DashboardPage.content.overview.refresh
    DashboardPage.content.activity.list

## Synchronization check

When the FrnlTS documentation is changed, this invariant specification must be checked against:

- docs/architecture.md
- docs/terminology.md
- docs/concepts/ui-primitives.md
- docs/concepts/ui-composites.md
- docs/concepts/slots.md
- docs/concepts/flows.md
- docs/concepts/states.md
- docs/concepts/events.md
- docs/ui-primitive.md

No document may describe a Composite Slot as accepting only Primitives, and no document may describe a Composite as a Visual Asset owner.
