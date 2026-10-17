import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import type { StoreApi } from 'zustand/vanilla';
import { useStore } from 'zustand';
import type { FrnlState, EntityKind } from '../runtime/store.js';
import { compositePropsSchema, slotPropsSchema } from './validation.js';

export interface FrnlSlotProps {
  id: string;
  address: string;
  occupantId?: string | null;
  occupantKind?: EntityKind | null;
  occupants?: Record<string, ReactNode>;
  properties?: Record<string, unknown>;
  className?: string;
  style?: CSSProperties;
  store: StoreApi<FrnlState>;
}

export function FrnlSlot({
  id,
  address,
  occupantId = null,
  occupantKind = null,
  occupants = {},
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
    className,
    style,
    store,
  });

  useEffect(() => {
    store.getState().registerSlot(id, {
      id,
      address,
      occupantId: occupantId ?? null,
      occupantKind: occupantKind ?? null,
      properties,
    });
  }, [id, address, store]);

  const prevPropsRef = useRef({ properties });

  // Synchronize slot property prop changes to store
  useEffect(() => {
    const prev = prevPropsRef.current;
    const current = store.getState().slots[id];
    if (!current || !properties) return;
    if (properties !== prev.properties) {
      let propertiesChanged = false;
      const prevProps = prev.properties ?? {};
      for (const [key, value] of Object.entries(properties)) {
        if (prevProps[key] !== value) {
          propertiesChanged = true;
          break;
        }
      }
      if (propertiesChanged) {
        store.getState().setSlotProperties(id, properties);
      }
      prevPropsRef.current = { properties };
    }
  }, [id, properties, store]);

  const slot = useStore(store, (current) => current.slots[id]);
  const effectiveProperties = slot?.properties ?? properties;
  // If slot exists in store, its occupantId is authoritative (including null)
  const activeOccupantId = slot !== undefined ? slot.occupantId : (occupantId ?? null);
  const renderedOccupant = (activeOccupantId && occupants[activeOccupantId]) ? occupants[activeOccupantId] : null;

  return (
    <div
      data-frnl-kind="slot"
      data-frnl-slot-id={id}
      data-frnl-address={slot?.address ?? address}
      data-frnl-occupant-id={activeOccupantId ?? undefined}
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

  const prevPropsRef = useRef({ state, properties });

  useEffect(() => {
    store.getState().registerEntity(id, {
      kind: 'composite',
      state,
      properties,
    });
  }, [id, store]);

  // Synchronize dynamic state and property changes to store (without stale overwrite)
  useEffect(() => {
    const prev = prevPropsRef.current;
    const current = store.getState().entities[id];
    if (!current) return;

    if (state !== undefined && state !== prev.state) {
      if (current.state !== state) {
        store.getState().setEntityState(id, state);
      }
    }

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

    prevPropsRef.current = { state, properties };
  }, [id, state, properties, store]);

  const entity = useStore(store, (current) => current.entities[id]);
  const effectiveState = entity?.state ?? state;
  const effectiveProperties = entity?.properties ?? properties;

  return (
    <div
      data-frnl-kind="ui-composite"
      data-frnl-id={id}
      data-frnl-state={effectiveState}
      className={className}
      style={{
        position: 'relative',
        ...style,
        ...((effectiveProperties.style as CSSProperties | undefined) ?? {}),
      }}
    >
      {slots}
    </div>
  );
}
