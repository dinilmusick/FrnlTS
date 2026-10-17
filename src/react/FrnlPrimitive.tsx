import { useEffect, type CSSProperties, type ReactNode } from 'react';
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
}: FrnlPrimitiveProps) {
  primitivePropsSchema.parse({ id, bounds, state, properties, children, className, style, store, as: Component });
  const entity = useStore(store, (current) => current.entities[id]);

  useEffect(() => {
    store.getState().registerEntity(id, {
      kind: 'primitive',
      state,
      properties,
    });
  }, [id, state, properties, store]);

  const effectiveState = entity?.state ?? state;
  const effectiveProperties = entity?.properties ?? properties;

  return (
    <Component
      data-frnl-kind="ui-primitive"
      data-frnl-id={id}
      data-frnl-state={effectiveState}
      className={className}
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
