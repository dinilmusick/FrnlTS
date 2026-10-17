import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import type React from 'react';
import type { StoreApi } from 'zustand/vanilla';
import { useStore } from 'zustand';
import type { FrnlState } from '../runtime/store.js';
import { primitivePropsSchema } from './validation.js';

export interface FrnlPrimitiveProps {
  id: string;
  bounds?: { width?: number | string; height?: number | string };
  state?: string;
  properties?: Record<string, unknown>;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  as?: React.ElementType;
  hostProps?: Record<string, unknown>;
  store: StoreApi<FrnlState>;
}

export function FrnlPrimitive({
  id,
  bounds,
  state = 'default',
  properties = {},
  children,
  className,
  style,
  store,
  as: Component = 'div',
  hostProps = {},
}: FrnlPrimitiveProps) {
  // Validate props at runtime boundary
  primitivePropsSchema.parse({
    id,
    bounds,
    state,
    properties,
    children,
    className,
    style,
    store,
    as: Component,
    hostProps,
  });

  const registeredRef = useRef<string | null>(null);

  // Register entity on mount or when id/store changes
  useEffect(() => {
    store.getState().registerEntity(id, {
      kind: 'primitive',
      state,
      properties,
      bounds,
    });
    registeredRef.current = id;
  }, [id, store]);

  // Synchronize state prop changes to store if different
  useEffect(() => {
    if (registeredRef.current === id) {
      const current = store.getState().entities[id];
      if (current && current.state !== state) {
        store.getState().setEntityState(id, state);
      }
    }
  }, [id, state, store]);

  // Subscribe to live entity state in store
  const entity = useStore(store, (current) => current.entities[id]);
  const effectiveState = entity?.state ?? state;
  const effectiveProperties = entity?.properties ?? properties;

  return (
    <Component
      data-frnl-kind="ui-primitive"
      data-frnl-id={id}
      data-frnl-state={effectiveState}
      className={className}
      {...hostProps}
      style={{
        position: 'relative',
        width: bounds?.width,
        height: bounds?.height,
        ...style,
        ...((effectiveProperties.style as CSSProperties | undefined) ?? {}),
      }}
    >
      {children}
    </Component>
  );
}
