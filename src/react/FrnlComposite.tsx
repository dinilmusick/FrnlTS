import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import type { StoreApi } from 'zustand/vanilla';
import { useStore } from 'zustand';
import type { FrnlState, EntityKind } from '../runtime/store.js';
import { compositePropsSchema, slotPropsSchema } from './validation.js';

export interface FrnlSlotProps {
  id: string;
  address: string;
  occupantId: string;
  occupantKind: EntityKind;
  occupants: Record<string, ReactNode>;
  properties?: Record<string, unknown>;
  className?: string;
  style?: CSSProperties;
  store: StoreApi<FrnlState>;
}

export function FrnlSlot({
  id,
  address,
  occupantId,
  occupantKind,
  occupants,
  properties = {},
  className,
  style,
  store,
}: FrnlSlotProps) {
  slotPropsSchema.parse({
    id,
    address,
    occupantId,
    occupantKind,
    occupants,
    properties,
    store,
  });

  useEffect(() => {
    store.getState().registerSlot(id, {
      id,
      address,
      occupantId,
      occupantKind,
      properties,
    });
  }, [id, address, store]);

  const slot = useStore(store, (current) => current.slots[id]);
  const effectiveProperties = slot?.properties ?? properties;
  const activeOccupantId = slot?.occupantId ?? occupantId;
  const renderedOccupant = occupants[activeOccupantId] ?? null;

  return (
    <div
      data-frnl-kind="slot"
      data-frnl-slot-id={id}
      data-frnl-address={slot?.address ?? address}
      data-frnl-occupant-id={activeOccupantId}
      className={className}
      style={{
        position: 'relative',
        ...style,
        ...((effectiveProperties.style as CSSProperties | undefined) ?? {}),
      }}
    >
      {renderedOccupant}
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
  compositePropsSchema.parse({
    id,
    state,
    properties,
    slots,
    className,
    style,
    store,
  });

  const registeredRef = useRef<string | null>(null);

  useEffect(() => {
    store.getState().registerEntity(id, {
      kind: 'composite',
      state,
      properties,
    });
    registeredRef.current = id;
  }, [id, store]);

  useEffect(() => {
    if (registeredRef.current === id) {
      const current = store.getState().entities[id];
      if (current && current.state !== state) {
        store.getState().setEntityState(id, state);
      }
    }
  }, [id, state, store]);

  const entity = useStore(store, (current) => current.entities[id]);

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
