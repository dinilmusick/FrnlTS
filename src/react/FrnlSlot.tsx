import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import type { StoreApi } from 'zustand/vanilla';
import { useStore } from 'zustand';
import type { FrnlState } from '../runtime/store.js';

export interface FrnlSlotProps {
  id: string;
  address: string;
  occupantId?: string | null;
  occupants?: Record<string, ReactNode>;
  properties?: Record<string, unknown>;
  className?: string;
  style?: CSSProperties;
  store: StoreApi<FrnlState>;
}

export function FrnlSlot({
  id, address, occupantId = null, occupants = {}, properties = {},
  className, style, store,
}: FrnlSlotProps) {
  useEffect(() => {
    store.getState().registerSlot(id, {
      id, address, occupantId: occupantId ?? null, properties,
    });
  }, [id, address, store]);

  const prev = useRef(properties);
  useEffect(() => {
    if (properties !== prev.current) {
      store.getState().setSlotProperties(id, properties);
      prev.current = properties;
    }
  }, [id, properties, store]);

  const slot = useStore(store, (current) => current.slots[id]);
  const activeOccupantId = slot !== undefined ? slot.occupantId : occupantId;
  const renderedOccupant = activeOccupantId ? occupants[activeOccupantId] ?? null : null;

  return (
    <div
      data-frnl-kind="slot"
      data-frnl-slot-id={id}
      data-frnl-address={slot?.address ?? address}
      data-frnl-occupant-id={activeOccupantId ?? undefined}
      className={className}
      style={{ position: 'relative', ...style, ...((slot?.properties ?? properties).style as CSSProperties | undefined) }}
    >
      {renderedOccupant}
    </div>
  );
}
