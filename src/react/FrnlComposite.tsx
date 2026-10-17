import { useEffect, type CSSProperties, type ReactNode } from 'react';
import type { StoreApi } from 'zustand/vanilla';
import { useStore } from 'zustand';
import type { FrnlState } from '../runtime/store.js';
import { compositePropsSchema, slotPropsSchema } from './validation.js';

export interface FrnlSlotProps {
  id: string;
  address: string;
  occupantId: string;
  occupantKind: 'primitive' | 'composite';
  occupants: Record<string, ReactNode>;
  properties?: Record<string, unknown>;
  store: StoreApi<FrnlState>;
}

export function FrnlSlot({
  id,
  address,
  occupantId,
  occupantKind,
  occupants,
  properties = {},
  store,
}: FrnlSlotProps) {
  slotPropsSchema.parse({ id, address, occupantId, occupantKind, occupants, properties, store });
  const slot = useStore(store, (current) => current.slots[id]);

  useEffect(() => {
    store.getState().registerSlot(id, {
      id,
      address,
      occupantId,
      occupantKind,
      properties,
    });
  }, [id, address, occupantId, occupantKind, properties, store]);

  const effectiveProperties = slot?.properties ?? properties;

  return (
    <div
      data-frnl-kind="slot"
      data-frnl-slot-id={id}
      data-frnl-address={address}
      style={{
        position: 'relative',
        ...((effectiveProperties.style as CSSProperties | undefined) ?? {}),
      }}
    >
      {occupants[slot?.occupantId ?? occupantId] ?? null}
    </div>
  );
}

export interface FrnlCompositeProps {
  id: string;
  state?: string;
  properties?: Record<string, unknown>;
  slots: ReactNode;
  className?: string;
  style?: CSSProperties;
  store: StoreApi<FrnlState>;
}

export function FrnlComposite({
  id,
  state = 'default',
  properties = {},
  slots,
  className,
  style,
  store,
}: FrnlCompositeProps) {
  compositePropsSchema.parse({ id, state, properties, slots, className, style, store });
  const entity = useStore(store, (current) => current.entities[id]);

  useEffect(() => {
    store.getState().registerEntity(id, {
      kind: 'composite',
      state,
      properties,
    });
  }, [id, state, properties, store]);

  return (
    <div
      data-frnl-kind="ui-composite"
      data-frnl-id={id}
      data-frnl-state={entity?.state ?? state}
      className={className}
      style={{
        position: 'relative',
        ...style,
        ...((entity?.properties.style as CSSProperties | undefined) ?? {}),
      }}
    >
      {slots}
    </div>
  );
}
