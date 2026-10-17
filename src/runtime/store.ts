import { createStore, type StoreApi } from 'zustand/vanilla';
import { z } from 'zod';
import {
  entityIdSchema,
  entityPropertyChangedPayloadSchema,
  entityStateChangedPayloadSchema,
  entityStateSchema,
  occupantSchema,
  propertyKeySchema,
  slotOccupantChangedPayloadSchema,
  slotPropertyChangedPayloadSchema,
  slotStateChangedPayloadSchema,
  slotStateSchema,
  slotCollectionSchema,
  slotCollectionChangedPayloadSchema,
  flowTriggeredPayloadSchema,
  stateNameSchema,
  frnlEventSchema,
  type EntityKind,
  type EntityState,
  type SlotState,
  type SlotCollectionState,
  type FrnlEvent,
} from './validation.js';

export type {
  EntityKind,
  EntityState,
  SlotState,
  SlotCollectionState,
  FrnlEvent,
} from './validation.js';

export type FrnlStore = StoreApi<FrnlState>;

export interface FrnlState {
  entities: Record<string, EntityState>;
  slots: Record<string, SlotState>;
  slotCollections: Record<string, SlotCollectionState>;
  events: FrnlEvent[];
  setEntityState: (entityId: string, state: string) => void;
  setEntityProperty: (entityId: string, key: string, value: unknown) => void;
  setSlotProperty: (slotId: string, key: string, value: unknown) => void;
  replaceSlotOccupant: (slotId: string, occupant: { id: string; kind: EntityKind } | null) => void;
  registerEntity: (entityId: string, entity: EntityState) => void;
  registerSlot: (slotId: string, slot: SlotState) => void;
  registerSlotCollection: (collectionId: string, collection: { address: string; slotIds: string[] }) => void;
  setSlotCollection: (collectionId: string, slotIds: string[]) => void;
  addSlotToCollection: (collectionId: string, slotId: string) => void;
  removeSlotFromCollection: (collectionId: string, slotId: string) => void;
  triggerFlow: (flowId: string, compositeId: string, trigger: string, payload?: unknown) => void;
  emit: (event: FrnlEvent) => void;
}

export function createFrnlStore(
  initial?: Partial<Pick<FrnlState, 'entities' | 'slots' | 'slotCollections'>>
): StoreApi<FrnlState> {
  const initialEntities = z.record(z.string(), entityStateSchema).parse(initial?.entities ?? {});
  const initialSlots = z.record(z.string(), slotStateSchema).parse(initial?.slots ?? {});
  const initialCollections = z.record(z.string(), slotCollectionSchema).parse(initial?.slotCollections ?? {});

  return createStore<FrnlState>((set) => ({
    entities: initialEntities,
    slots: initialSlots,
    slotCollections: initialCollections,
    events: [],

    emit: (event) => {
      const validated = frnlEventSchema.parse(event);
      set((current) => ({ events: [...current.events, validated] }));
    },

    registerEntity: (entityId, entity) => {
      const id = entityIdSchema.parse(entityId);
      const validated = entityStateSchema.parse(entity);
      set((current) => {
        const existing = current.entities[id];
        // If entity already exists, preserve its current runtime state
        const nextEntity = existing
          ? { ...validated, state: existing.state, properties: { ...existing.properties, ...validated.properties } }
          : validated;
        return {
          entities: { ...current.entities, [id]: nextEntity },
        };
      });
    },

    registerSlot: (slotId, slot) => {
      const id = entityIdSchema.parse(slotId);
      const validated = slotStateSchema.parse(slot);
      set((current) => {
        const existing = current.slots[id];
        // If slot already exists, preserve its current occupant
        const nextSlot = existing
          ? {
              ...validated,
              occupantId: existing.occupantId,
              occupantKind: existing.occupantKind,
              properties: { ...existing.properties, ...validated.properties },
            }
          : validated;
        return {
          slots: { ...current.slots, [id]: nextSlot },
        };
      });
    },

    registerSlotCollection: (collectionId, collection) => {
      const id = entityIdSchema.parse(collectionId);
      const validated = slotCollectionSchema.parse({ id, ...collection });
      set((current) => ({
        slotCollections: { ...current.slotCollections, [id]: validated },
      }));
    },

    setSlotCollection: (collectionId, slotIds) => {
      const id = entityIdSchema.parse(collectionId);
      const validatedIds = z.array(entityIdSchema).parse(slotIds);
      set((current) => {
        const col = current.slotCollections[id];
        if (!col) return current;
        const payload = slotCollectionChangedPayloadSchema.parse({
          collectionId: id,
          address: col.address,
          slotIds: validatedIds,
          action: 'set',
        });
        return {
          slotCollections: {
            ...current.slotCollections,
            [id]: { ...col, slotIds: validatedIds },
          },
          events: [...current.events, { type: 'slot.collectionChanged' as const, payload }],
        };
      });
    },

    addSlotToCollection: (collectionId, slotId) => {
      const cId = entityIdSchema.parse(collectionId);
      const sId = entityIdSchema.parse(slotId);
      set((current) => {
        const col = current.slotCollections[cId];
        if (!col) return current;
        if (col.slotIds.includes(sId)) return current;
        const nextIds = [...col.slotIds, sId];
        const payload = slotCollectionChangedPayloadSchema.parse({
          collectionId: cId,
          address: col.address,
          slotIds: nextIds,
          action: 'add',
        });
        return {
          slotCollections: {
            ...current.slotCollections,
            [cId]: { ...col, slotIds: nextIds },
          },
          events: [...current.events, { type: 'slot.collectionChanged' as const, payload }],
        };
      });
    },

    removeSlotFromCollection: (collectionId, slotId) => {
      const cId = entityIdSchema.parse(collectionId);
      const sId = entityIdSchema.parse(slotId);
      set((current) => {
        const col = current.slotCollections[cId];
        if (!col) return current;
        const nextIds = col.slotIds.filter((id) => id !== sId);
        const payload = slotCollectionChangedPayloadSchema.parse({
          collectionId: cId,
          address: col.address,
          slotIds: nextIds,
          action: 'remove',
        });
        return {
          slotCollections: {
            ...current.slotCollections,
            [cId]: { ...col, slotIds: nextIds },
          },
          events: [...current.events, { type: 'slot.collectionChanged' as const, payload }],
        };
      });
    },

    setEntityState: (entityId, state) => {
      const id = entityIdSchema.parse(entityId);
      const nextState = stateNameSchema.parse(state);
      set((current) => {
        const entity = current.entities[id];
        if (!entity) return current;
        if (entity.state === nextState) return current;

        const previousState = entity.state;
        const entityPayload = entityStateChangedPayloadSchema.parse({
          entityId: id,
          previousState,
          state: nextState,
        });

        const newEvents: FrnlEvent[] = [
          { type: 'entity.stateChanged' as const, payload: entityPayload },
        ];

        // Emit slot.stateChanged for any slot currently occupied by this entity
        for (const slot of Object.values(current.slots)) {
          if (slot.occupantId === id) {
            const slotStatePayload = slotStateChangedPayloadSchema.parse({
              slotId: slot.id,
              address: slot.address,
              occupantId: id,
              previousState,
              state: nextState,
            });
            newEvents.push({ type: 'slot.stateChanged' as const, payload: slotStatePayload });
          }
        }

        return {
          entities: { ...current.entities, [id]: { ...entity, state: nextState } },
          events: [...current.events, ...newEvents],
        };
      });
    },

    setEntityProperty: (entityId, key, value) => {
      const id = entityIdSchema.parse(entityId);
      const property = propertyKeySchema.parse(key);
      set((current) => {
        const entity = current.entities[id];
        if (!entity) return current;
        const payload = entityPropertyChangedPayloadSchema.parse({
          entityId: id,
          key: property,
          value,
        });
        return {
          entities: {
            ...current.entities,
            [id]: { ...entity, properties: { ...entity.properties, [property]: value } },
          },
          events: [...current.events, { type: 'entity.propertyChanged' as const, payload }],
        };
      });
    },

    setSlotProperty: (slotId, key, value) => {
      const id = entityIdSchema.parse(slotId);
      const property = propertyKeySchema.parse(key);
      set((current) => {
        const slot = current.slots[id];
        if (!slot) return current;
        const payload = slotPropertyChangedPayloadSchema.parse({
          slotId: id,
          key: property,
          value,
        });
        return {
          slots: {
            ...current.slots,
            [id]: { ...slot, properties: { ...slot.properties, [property]: value } },
          },
          events: [...current.events, { type: 'slot.propertyChanged' as const, payload }],
        };
      });
    },

    replaceSlotOccupant: (slotId, occupant) => {
      const id = entityIdSchema.parse(slotId);
      const validatedOccupant = occupant === null ? null : occupantSchema.parse(occupant);
      set((current) => {
        const slot = current.slots[id];
        if (!slot) return current;
        const previousOccupant =
          slot.occupantId && slot.occupantKind
            ? { id: slot.occupantId, kind: slot.occupantKind }
            : null;
        const payload = slotOccupantChangedPayloadSchema.parse({
          slotId: id,
          address: slot.address,
          previousOccupant,
          occupant: validatedOccupant,
        });
        return {
          slots: {
            ...current.slots,
            [id]: {
              ...slot,
              occupantId: validatedOccupant?.id ?? null,
              occupantKind: validatedOccupant?.kind ?? null,
            },
          },
          events: [...current.events, { type: 'slot.occupantChanged' as const, payload }],
        };
      });
    },

    triggerFlow: (flowId, compositeId, trigger, payload) => {
      const fId = z.string().min(1).parse(flowId);
      const cId = entityIdSchema.parse(compositeId);
      const trig = z.string().min(1).parse(trigger);
      const eventPayload = flowTriggeredPayloadSchema.parse({
        flowId: fId,
        compositeId: cId,
        trigger: trig,
        payload,
      });
      set((current) => ({
        events: [
          ...current.events,
          { type: 'flow.triggered' as const, payload: eventPayload },
        ],
      }));
    },
  }));
}
