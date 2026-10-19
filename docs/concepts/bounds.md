# Bounds

Bounds define the interaction area of a Component.

## Interaction

Pointer interaction is evaluated against Bounds. A pointer event occurring outside Bounds does not trigger the component, even when a Visual Asset is rendered outside Bounds.

## Rendering

Bounds do not automatically clip Visual Assets. Each Visual Asset independently declares whether it is clipped to the component's Bounds.

- clipping enabled: the asset is masked to Bounds.
- clipping disabled: the asset may render outside Bounds.

Disabling clipping never expands the interaction area.
