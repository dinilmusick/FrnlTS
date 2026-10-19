import { createStore, type StoreApi } from 'zustand/vanilla';
import type { FrnlElementDefinition } from '../elements/definition.js';
import { z } from 'zod';
import {
  entityIdSchema,
  entityPropertyChangedPayloadSchema,
  entityStateChangedPayloadSchema,
  entityStateSchema,
  occupantSchema,
  propertyKeySchema,
  propertiesSchema,
  boundsSchema,
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
  type Bounds,
} from './validation.js';

export type {
  EntityKind,
  EntityState,
  SlotState,
  SlotCollectionState,
  FrnlEvent,
  Bounds,
} from './validation.js';

export type FrnlStore = StoreApi<FrnlState>;

export interface FrnlState {
  entities: Record<string, EntityState>;
  slots: Record<string, SlotState>;
  slotCollections: Record<string, SlotCollectionState>;
  events: FrnlEvent[];
  elementDefinitions: Record<string, FrnlElementDefinition>;
  eventHandlers: Record<string, Record<string, (
    payload: unknown,
    context: { readonly componentId: string; readonly state: string; setState(state: string): void; setVisualParameter(parameter: string, value: unknown): void; getLibrary<T = unknown>(address: string): T }
  ) => unknown>>;
  componentParents: Record<string, string | undefined>;
  visualOverrides: Record<string, Record<string, unknown>>;
  libraries: Record<string, unknown>;
  setEntityState: (entityId: string, state: string) => void;
  setEntityProperty: (entityId: string, key: string, value: unknown) => void;
  setEntityProperties: (entityId: string, properties: Record<string, unknown>) => void;
  setEntityBounds: (entityId: string, bounds?: Bounds) => void;
  setSlotProperty: (slotId: string, key: string, value: unknown) => void;
  setSlotProperties: (slotId: string, properties: Record<string, unknown>) => void;
  replaceSlotOccupant: (slotId: string, occupant: { id: string; kind: EntityKind } | null) => void;
  registerEntity: (entityId: string, entity: EntityState) => void;
  registerSlot: (slotId: string, slot: SlotState) => void;
  registerSlotCollection: (collectionId: string, collection: { address: string; slotIds: string[] }) => void;
  setSlotCollection: (collectionId: string, slotIds: string[]) => void;
  addSlotToCollection: (collectionId: string, slotId: string) => void;
  removeSlotFromCollection: (collectionId: string, slotId: string) => void;
  triggerFlow: (flowId: string, compositeId: string, trigger: string, payload?: unknown) => void;
  emit: (event: FrnlEvent) => void;
  registerElementDefinition: (componentId: string, definition: FrnlElementDefinition) => void;
  registerEventHandlers: (componentId: string, handlers: Record<string, (
    payload: unknown,
    context: { readonly componentId: string; readonly state: string; setState(state: string): void; setVisualParameter(parameter: string, value: unknown): void; getLibrary<T = unknown>(address: string): T }
  ) => unknown>) => void;
  unregisterEventHandlers: (componentId: string) => void;
  registerComponentParent: (componentId: string, parentId?: string) => void;
  unregisterEntity: (entityId: string) => void;
  setVisualOverride: (componentId: string, parameter: string, value: unknown) => void;
  clearVisualOverrides: (componentId: string) => void;
  registerLibrary: (address: string, library: unknown) => void;
  unregisterLibrary: (address: string) => void;
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
    elementDefinitions: {},
    eventHandlers: {},
    componentParents: {},
    visualOverrides: {},
    libraries: {},

    registerElementDefinition: (componentId, definition) => {
      const id = entityIdSchema.parse(componentId);
      set((current) => ({ elementDefinitions: { ...current.elementDefinitions, [id]: definition } }));
    },

    registerEventHandlers: (componentId, handlers) => {
      const id = entityIdSchema.parse(componentId);
      set((current) => ({ eventHandlers: { ...current.eventHandlers, [id]: handlers } }));
    },

    unregisterEventHandlers: (componentId) => {
      const id = entityIdSchema.parse(componentId);
      set((current) => {
        const next = { ...current.eventHandlers };
        delete next[id];
        return { eventHandlers: next };
      });
    },

    unregisterEntity: (entityId) => {
      const id = entityIdSchema.parse(entityId);
      set((current) => {
        const entities = { ...current.entities };
        const elementDefinitions = { ...current.elementDefinitions };
        const eventHandlers = { ...current.eventHandlers };
        const componentParents = { ...current.componentParents };
        const visualOverrides = { ...current.visualOverrides };
        delete entities[id];
        delete elementDefinitions[id];
        delete eventHandlers[id];
        delete componentParents[id];
        delete visualOverrides[id];
        return { entities, elementDefinitions, eventHandlers, componentParents, visualOverrides };
      });
    },

    setVisualOverride: (componentId, parameter, value) => {
      const id = entityIdSchema.parse(componentId);
      const key = propertyKeySchema.parse(parameter);
      set((current) => ({
        visualOverrides: {
          ...current.visualOverrides,
          [id]: { ...(current.visualOverrides[id] ?? {}), [key]: value },
        },
      }));
    },

    clearVisualOverrides: (componentId) => {
      const id = entityIdSchema.parse(componentId);
      set((current) => {
        const visualOverrides = { ...current.visualOverrides };
        delete visualOverrides[id];
        return { visualOverrides };
      });
    },

    registerLibrary: (address, library) => {
      const key = z.string().min(1).parse(address);
      set((current) => ({ libraries: { ...current.libraries, [key]: library } }));
    },

    unregisterLibrary: (address) => {
      const key = z.string().min(1).parse(address);
      set((current) => {
        const libraries = { ...current.libraries };
        delete libraries[key];
        return { libraries };
      });
    },

    registerComponentParent: (componentId, parentId) => {
      const id = entityIdSchema.parse(componentId);
      const parent = parentId === undefined ? undefined : entityIdSchema.parse(parentId);
      if (parent === id) throw new Error(`Frnl component cannot be its own parent: ${id}`);
      set((current) => ({
        componentParents: { ...current.componentParents, [id]: parent },
      }));
    },

    emit: (event) => {
      const validated = frnlEventSchema.parse(event);
      set((current) => ({ events: [...current.events, validated] }));
    },

    /**
     * registerEntity performs an idempotent upsert of declarative metadata.
     *
     * Semantic Authority Model:
     * - Declarative Metadata (authoritative from registration / props):
     *   `kind`, `properties`, `bounds`, `assets`.
     * - Runtime State (authoritative from runtime / interactions):
     *   `state` (active state is preserved across re-registrations),
     *   `events` (event history is preserved).
     */
    registerEntity: (entityId, entity) => {
      const id = entityIdSchema.parse(entityId);
      const validated = entityStateSchema.parse(entity);
      set((current) => {
        const existing = current.entities[id];
        const nextEntity: EntityState = existing
          ? {
              kind: validated.kind,
              // Runtime state is preserved if already set
              state: existing.state,
              // Declarative metadata is merged / updated
              properties: { ...existing.properties, ...validated.properties },
              bounds: validated.bounds ?? existing.bounds,
              assets: validated.assets ?? existing.assets,
            }
          : validated;
        return {
          entities: { ...current.entities, [id]: nextEntity },
        };
      });
    },

    /**
     * registerSlot performs an idempotent upsert of slot declaration.
     *
     * Semantic Authority Model:
     * - Declarative Metadata: `address`, `properties`.
     * - Runtime-Owned: `occupantId`, `occupantKind` (preserved if already set in runtime).
     */
    registerSlot: (slotId, slot) => {
      const id = entityIdSchema.parse(slotId);
      const validated = slotStateSchema.parse(slot);
      set((current) => {
        const existing = current.slots[id];
        const nextSlot: SlotState = existing
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

        const visualOverrides = { ...current.visualOverrides };
        delete visualOverrides[id];
        return {
          entities: { ...current.entities, [id]: { ...entity, state: nextState } },
          visualOverrides,
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

    setEntityProperties: (entityId, properties) => {
      const id = entityIdSchema.parse(entityId);
      const validated = propertiesSchema.parse(properties);
      set((current) => {
        const entity = current.entities[id];
        if (!entity) return current;
        const newEvents: FrnlEvent[] = [];
        for (const [key, value] of Object.entries(validated)) {
          if (entity.properties[key] !== value) {
            newEvents.push({
              type: 'entity.propertyChanged' as const,
              payload: entityPropertyChangedPayloadSchema.parse({
                entityId: id,
                key,
                value,
              }),
            });
          }
        }
        return {
          entities: {
            ...current.entities,
            [id]: {
              ...entity,
              properties: { ...entity.properties, ...validated },
            },
          },
          events: [...current.events, ...newEvents],
        };
      });
    },

    setEntityBounds: (entityId, bounds) => {
      const id = entityIdSchema.parse(entityId);
      const validated = bounds ? boundsSchema.parse(bounds) : undefined;
      set((current) => {
        const entity = current.entities[id];
        if (!entity) return current;
        return {
          entities: {
            ...current.entities,
            [id]: { ...entity, bounds: validated },
          },
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

    setSlotProperties: (slotId, properties) => {
      const id = entityIdSchema.parse(slotId);
      const validated = propertiesSchema.parse(properties);
      set((current) => {
        const slot = current.slots[id];
        if (!slot) return current;
        const newEvents: FrnlEvent[] = [];
        for (const [key, value] of Object.entries(validated)) {
          if (slot.properties[key] !== value) {
            newEvents.push({
              type: 'slot.propertyChanged' as const,
              payload: slotPropertyChangedPayloadSchema.parse({
                slotId: id,
                key,
                value,
              }),
            });
          }
        }
        return {
          slots: {
            ...current.slots,
            [id]: {
              ...slot,
              properties: { ...slot.properties, ...validated },
            },
          },
          events: [...current.events, ...newEvents],
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
