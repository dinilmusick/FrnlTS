# Slots

A Slot is a named, addressable position backed by the Frnl runtime. It provides a stable boundary around a rendered React component instance.

## Slot structure

```text
React component
    └── FrnlSlot
          └── occupant component instance
```

The Slot identity and address remain stable while its occupant changes.

## Runtime boundary

A Slot is a live semantic boundary rather than a declaration-only placeholder.

```text
Page.content
    occupant = Overview
        ↓
    occupant = Activity
```

Replacing the occupant does not require reconstructing the Slot. The runtime preserves the Slot's identity, address, properties, and event boundary.

## Slot properties

Slot Properties describe the relationship between the Slot and its occupant. Examples include position, scale, rotation, visibility, ordering, and alignment.

They do not mutate the intrinsic state or properties of the occupying component.

## Slot collections

A component can manage a repeatable Slot collection when a variable number of occupants is required:

```text
Page.items[0]
Page.items[1]
Page.items[2]
```

The collection can grow, shrink, insert, remove, or reorder Slot instances at runtime.

## Slot events

At minimum:

- **stateChanged** — emitted when the component occupying the Slot changes Frnl state.
- **occupantChanged** — emitted when the component occupying the Slot is replaced.
- **propertyChanged** — emitted when a Slot property changes.
- **collectionChanged** — emitted when a repeatable collection changes membership/order.

## Addressing

Slots participate in hierarchical semantic addresses:

```text
Page.content
Page.content.overview
Page.content.overview.actions
```

The runtime stores parent relationships by component ID; concrete React composition remains ordinary React code.

## Runtime validation

Slot IDs, addresses, occupant IDs, properties, and emitted Slot events are validated at the runtime boundary with Zod.
