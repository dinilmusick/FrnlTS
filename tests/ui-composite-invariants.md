# UI Composite Semantic Invariants

This document is the validation test specification for the recursive UI Composite model and live Slot system.

A documentation/runtime implementation is considered inconsistent if any invariant below is violated.

## Invariants

1. FRNL has exactly two first-class UI entity categories in this model: UI Primitive and UI Composite.
2. Every UI Composite has named Slots.
3. Every Slot contains exactly one UI entity at a time.
4. A Slot may contain a UI Primitive.
5. A Slot may contain a UI Composite.
6. Because Composite Slots may contain Composites, Composite nesting is recursive.
7. FRNL does not impose a fixed maximum Composite nesting depth.
8. A Composite does not own Visual Assets.
9. A Slot has its own overridable/modulatable Properties for the relationship between the Slot and its occupant.
10. Slot Properties may provide basic layout/transformation controls such as position, scale, rotation, visibility, ordering, and alignment.
11. A modulatable Slot Property may use a Curve with the same canonical one-second domain and Attack/Sustain/Release timing semantics as other FRNL properties.
12. Primitive Events remain owned by their Primitive even when referenced by a Composite Flow.
13. Slots have their own Slot Events.
14. State Changed is a Slot Event fired when the occupying UI Primitive or UI Composite changes State.
15. Occupant Changed is a Slot Event fired when the entity occupying a Slot is replaced.
16. A Slot occupant may be replaced while the containing UI is actively rendering.
17. Replacing an occupant preserves Slot identity, Slot address, Slot Properties, and Slot Event interface.
18. A repeatable Slot Collection may change cardinality at runtime.
19. Composite Flows may coordinate Primitive Events, Slot Events, actions, state changes, data operations, Slot occupant replacement, Slot Property changes, and external functions.
20. Composite States do not own Visual Assets.
21. Composite States use the same Attack, Sustain, Release and Curve timing semantics as Primitive States.
22. Slot names establish hierarchical semantic addresses for Slots and their occupants.
23. Page -> Section -> nested Composite is a valid composition pattern without introducing a new foundational entity type.
24. Renderer-specific implementation details are not part of the FRNL semantic contract.

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

## Representative live Slot assertion

A renderer/runtime must be semantically capable of:

    DashboardPage.content
        occupant = OverviewSection
            ↓
        replace occupant
            ↓
        occupant = ActivitySection

The Slot remains `DashboardPage.content` throughout the replacement.

The replacement must preserve the Slot's:

- identity
- address
- Slot Properties
- Slot Event interface

and must emit Occupant Changed.

A State transition of the current occupant must emit State Changed at the Slot boundary.

## Synchronization check

When the FrnlTS documentation is changed, this invariant specification must be checked against:

- docs/architecture.md
- docs/terminology.md
- docs/concepts/ui-primitives.md
- docs/concepts/ui-composites.md
- docs/concepts/slots.md
- docs/concepts/flows.md
- docs/concepts/states.md
- docs/concepts/properties.md
- docs/concepts/events.md
- docs/ui-primitive.md

No document may describe a Composite Slot as accepting only Primitives, and no document may describe a Composite as a Visual Asset owner.

No document may describe a Slot as a permanently fixed occupant if the Slot is used as a live/repeatable Slot boundary.
