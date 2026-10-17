import { createStore, type StoreApi } from 'zustand/vanilla';

export type EntityKind = 'primitive' | 'composite';

export interface EntityState {
  kind: EntityKind;
  state: string;
  properties: Record<string, unknown>;
}

export interface SlotState {
  id: string;
  address: string;
  occupantId: string | null;
  occupantKind: EntityKind | null;
  properties: Record<string, unknown>;
}

export interface FrnlState {
  entities: Record<string, EntityState>;
  slots: Record<string, SlotState>;
  setEntityState: (entityId: string, state: string) => void;
  setEntityProperty: (entityId: string, key: string, value: unknown) => void;
  setSlotProperty: (slotId: string, key: string, value: unknown) => void;
  replaceSlotOccupant: (
    slotId: string,
    occupant: { id: string; kind: EntityKind } | null,
  ) => void;
  registerEntity: (entityId: string, entity: EntityState) => void;
  registerSlot: (slotId: string, slot: SlotState) => void;
}

export function createFrnlStore(initial?: Partial<Pick<FrnlState, 'entities' | 'slots'>>): StoreApi<FrnlState> {
  return createStore<FrnlState>((set) => ({
    entities: initial?.entities ?? {},
    slots: initial?.slots ?? {},
    registerEntity: (entityId, entity) =>
      set((current) => ({
        entities: { ...current.entities, [entityId]: current.entities[entityId] ?? entity },
      })),
    registerSlot: (slotId, slot) =>
      set((current) => ({
        slots: { ...current.slots, [slotId]: current.slots[slotId] ?? slot },
      })),
    setEntityState: (entityId, state) =>
      set((current) => {
        const entity = current.entities[entityId];
        if (!entity) return current;
        return { entities: { ...current.entities, [entityId]: { ...entity, state } } };
      }),
    setEntityProperty: (entityId, key, value) =>
      set((current) => {
        const entity = current.entities[entityId];
        if (!entity) return current;
        return {
          entities: {
            ...current.entities,
            [entityId]: {
              ...entity,
              properties: { ...entity.properties, [key]: value },
            },
          },
        };
      }),
    setSlotProperty: (slotId, key, value) =>
      set((current) => {
        const slot = current.slots[slotId];
        if (!slot) return current;
        return {
          slots: {
            ...current.slots,
            [slotId]: { ...slot, properties: { ...slot.properties, [key]: value } },
          },
        };
      }),
    replaceSlotOccupant: (slotId, occupant) =>
      set((current) => {
        const slot = current.slots[slotId];
        if (!slot) return current;
        return {
          slots: {
            ...current.slots,
            [slotId]: {
              ...slot,
              occupantId: occupant?.id ?? null,
              occupantKind: occupant?.kind ?? null,
            },
          },
        };
      }),
  }));
}
