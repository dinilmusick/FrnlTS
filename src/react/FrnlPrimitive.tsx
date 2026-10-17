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

  const prevPropsRef = useRef({ state, properties, bounds });

  // Register entity on mount or when id/store changes (idempotent upsert)
  useEffect(() => {
    store.getState().registerEntity(id, {
      kind: 'primitive',
      state,
      properties,
      bounds,
    });
  }, [id, store]);

  // Synchronize dynamic state, properties, and bounds prop changes to store (without stale overwrite)
  useEffect(() => {
    const prev = prevPropsRef.current;
    const current = store.getState().entities[id];
    if (!current) return;

    // 1. State synchronization (only if state PROP has actually changed by caller)
    if (state !== undefined && state !== prev.state) {
      if (current.state !== state) {
        store.getState().setEntityState(id, state);
      }
    }

    // 2. Property synchronization (only if properties PROP has actually changed by caller)
    if (properties && properties !== prev.properties) {
      let propertiesChanged = false;
      const prevProps = prev.properties ?? {};
      for (const [key, value] of Object.entries(properties)) {
        if (prevProps[key] !== value) {
          propertiesChanged = true;
          break;
        }
      }
      if (propertiesChanged) {
        store.getState().setEntityProperties(id, properties);
      }
    }

    // 3. Bounds synchronization (only if bounds PROP has actually changed by caller)
    if (bounds && bounds !== prev.bounds) {
      if (prev.bounds?.width !== bounds.width || prev.bounds?.height !== bounds.height) {
        store.getState().setEntityBounds(id, bounds);
      }
    }

    prevPropsRef.current = { state, properties, bounds };
  }, [id, state, properties, bounds, store]);

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
