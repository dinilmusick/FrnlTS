# Bounds

Bounds define the interaction area of a UI Primitive.

## Interaction

Pointer interaction is evaluated against Bounds. A pointer event occurring outside Bounds does not trigger the primitive, even when a Visual Asset is rendered outside Bounds.

## Rendering

Bounds do not automatically clip Visual Assets. Each Visual Asset independently declares whether it is clipped to the primitive's Bounds.

- clipping enabled: the asset is masked to Bounds.
- clipping disabled: the asset may render outside Bounds.

Disabling clipping never expands the interaction area.
