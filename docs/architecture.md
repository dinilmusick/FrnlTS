# FRNL-TS Architecture

FRNL-TS defines the semantic building blocks for frontend UI primitives.

FRNL-TS -> defines frontend semantic building blocks
Theta-Engine -> defines concrete UI primitives
Floks -> stores concrete UI primitives

FRNL is not the component library or component store. It defines the concepts and contracts that make concrete UI primitive definitions structurally consistent.

## Core model

A UI Primitive consists of Bounds, one or more Visual Assets, Events, and States.

Visual Assets may extend beyond Bounds. Each asset independently determines whether it is clipped to the primitive's Bounds. Rendering outside Bounds does not expand the interaction area.

Events belong to the UI Primitive, not individual Visual Assets. Pointer and keyboard events are evaluated against the primitive's Bounds. Custom events may be triggered programmatically and may call registered external functions.

## Temporal model

A Curve has a canonical one-second domain. Curves do not own playback duration.

- Attack has an explicit finite duration.
- Release has an explicit finite duration.
- Sustain has no duration.
- During Sustain, property curves loop over their one-second domain.
- During Attack and Release, the one-second curve is stretched or compressed to the phase duration.

State does not own a timeline duration. Phase execution determines temporal interpretation.
