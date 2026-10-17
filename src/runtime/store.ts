import { createStore, type StoreApi } from 'zustand/vanilla';
import { z } from 'zod';
import {
  entityIdSchema, entityPropertyChangedPayloadSchema, entityStateChangedPayloadSchema,
  entityStateSchema, occupantSchema, propertyKeySchema, slotOccupantChangedPayloadSchema,
  slotPropertyChangedPayloadSchema, slotStateSchema, stateNameSchema, frnlEventSchema, type EntityKind,
  type EntityState, type SlotState,
} from './validation.js';

export type { EntityKind, EntityState, SlotState } from './validation.js';

export type FrnlEvent =
  | { type: 'entity.stateChanged'; payload: z.infer<typeof entityStateChangedPayloadSchema> }
  | { type: 'entity.propertyChanged'; payload: z.infer<typeof entityPropertyChangedPayloadSchema> }
  | { type: 'slot.propertyChanged'; payload: z.infer<typeof slotPropertyChangedPayloadSchema> }
  | { type: 'slot.occupantChanged'; payload: z.infer<typeof slotOccupantChangedPayloadSchema> };

export interface FrnlState {
  entities: Record<string, EntityState>;
  slots: Record<string, SlotState>;
  events: FrnlEvent[];
  setEntityState: (entityId: string, state: string) => void;
  setEntityProperty: (entityId: string, key: string, value: unknown) => void;
  setSlotProperty: (slotId: string, key: string, value: unknown) => void;
  replaceSlotOccupant: (slotId: string, occupant: { id: string; kind: EntityKind } | null) => void;
  registerEntity: (entityId: string, entity: EntityState) => void;
  registerSlot: (slotId: string, slot: SlotState) => void;
  emit: (event: FrnlEvent) => void;
}

export function createFrnlStore(initial?: Partial<Pick<FrnlState, 'entities' | 'slots'>>): StoreApi<FrnlState> {
  const initialEntities = z.record(z.string(), entityStateSchema).parse(initial?.entities ?? {});
  const initialSlots = z.record(z.string(), slotStateSchema).parse(initial?.slots ?? {});

  return createStore<FrnlState>((set) => ({
    entities: initialEntities, slots: initialSlots, events: [],
    emit: (event) => { const validated = frnlEventSchema.parse(event); set((current) => ({ events: [...current.events, validated] })); },
    registerEntity: (entityId, entity) => {
      const id = entityIdSchema.parse(entityId);
      const validated = entityStateSchema.parse(entity);
      set((current) => ({ entities: { ...current.entities, [id]: current.entities[id] ?? validated } }));
    },
    registerSlot: (slotId, slot) => {
      const id = entityIdSchema.parse(slotId);
      const validated = slotStateSchema.parse(slot);
      set((current) => ({ slots: { ...current.slots, [id]: current.slots[id] ?? validated } }));
    },
    setEntityState: (entityId, state) => {
      const id = entityIdSchema.parse(entityId), nextState = stateNameSchema.parse(state);
      set((current) => {
        const entity = current.entities[id]; if (!entity) return current;
        const payload = entityStateChangedPayloadSchema.parse({ entityId: id, previousState: entity.state, state: nextState });
        return { entities: { ...current.entities, [id]: { ...entity, state: nextState } }, events: [...current.events, { type: 'entity.stateChanged' as const, payload }] };
      });
    },
    setEntityProperty: (entityId, key, value) => {
      const id = entityIdSchema.parse(entityId), property = propertyKeySchema.parse(key);
      set((current) => {
        const entity = current.entities[id]; if (!entity) return current;
        const payload = entityPropertyChangedPayloadSchema.parse({ entityId: id, key: property, value });
        return { entities: { ...current.entities, [id]: { ...entity, properties: { ...entity.properties, [property]: value } } }, events: [...current.events, { type: 'entity.propertyChanged' as const, payload }] };
      });
    },
    setSlotProperty: (slotId, key, value) => {
      const id = entityIdSchema.parse(slotId), property = propertyKeySchema.parse(key);
      set((current) => {
        const slot = current.slots[id]; if (!slot) return current;
        const payload = slotPropertyChangedPayloadSchema.parse({ slotId: id, key: property, value });
        return { slots: { ...current.slots, [id]: { ...slot, properties: { ...slot.properties, [property]: value } } }, events: [...current.events, { type: 'slot.propertyChanged' as const, payload }] };
      });
    },
    replaceSlotOccupant: (slotId, occupant) => {
      const id = entityIdSchema.parse(slotId), validatedOccupant = occupant === null ? null : occupantSchema.parse(occupant);
      set((current) => {
        const slot = current.slots[id]; if (!slot) return current;
        const previousOccupant = slot.occupantId && slot.occupantKind ? { id: slot.occupantId, kind: slot.occupantKind } : null;
        const payload = slotOccupantChangedPayloadSchema.parse({ slotId: id, address: slot.address, previousOccupant, occupant: validatedOccupant });
        return { slots: { ...current.slots, [id]: { ...slot, occupantId: validatedOccupant?.id ?? null, occupantKind: validatedOccupant?.kind ?? null } }, events: [...current.events, { type: 'slot.occupantChanged' as const, payload }] };
      });
    },
  }));
}
