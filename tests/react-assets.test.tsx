import { describe, expect, it } from 'vitest';
import { createFrnlStore } from '../src/runtime/store.js';

describe('FrnlTS runtime contracts and store lifecycle', () => {
  it('uses one Zustand store for primitives, composites, and slots', () => {
    const store = createFrnlStore();

    store.getState().registerEntity('button', {
      kind: 'primitive',
      state: 'default',
      properties: {},
    });
    store.getState().registerEntity('form', {
      kind: 'composite',
      state: 'default',
      properties: {},
    });
    store.getState().registerSlot('form.submit', {
      id: 'form.submit',
      address: 'form.submit',
      occupantId: 'button',
      occupantKind: 'primitive',
      properties: { scale: 1 },
    });

    expect(store.getState().entities.button.kind).toBe('primitive');
    expect(store.getState().entities.form.kind).toBe('composite');
    expect(store.getState().slots['form.submit'].occupantId).toBe('button');
  });

  it('preserves slot identity while replacing its occupant', () => {
    const store = createFrnlStore();
    store.getState().registerSlot('content', {
      id: 'content',
      address: 'Page.content',
      occupantId: 'overview',
      occupantKind: 'composite',
      properties: { scale: 1 },
    });

    store.getState().replaceSlotOccupant('content', {
      id: 'activity',
      kind: 'composite',
    });

    const slot = store.getState().slots.content;
    expect(slot.id).toBe('content');
    expect(slot.address).toBe('Page.content');
    expect(slot.properties.scale).toBe(1);
    expect(slot.occupantId).toBe('activity');
    expect(store.getState().events.at(-1)).toMatchObject({
      type: 'slot.occupantChanged',
      payload: {
        slotId: 'content',
        address: 'Page.content',
        previousOccupant: { id: 'overview', kind: 'composite' },
        occupant: { id: 'activity', kind: 'composite' },
      },
    });
  });

  it('keeps primitive and composite state in the same global store', () => {
    const store = createFrnlStore();
    store.getState().registerEntity('button', {
      kind: 'primitive',
      state: 'default',
      properties: {},
    });
    store.getState().registerEntity('dialog', {
      kind: 'composite',
      state: 'default',
      properties: {},
    });

    store.getState().setEntityState('button', 'pressed');
    store.getState().setEntityState('dialog', 'open');

    expect(store.getState().entities.button.state).toBe('pressed');
    expect(store.getState().entities.dialog.state).toBe('open');
  });

  it('emits slot.stateChanged when the occupying entity transitions state', () => {
    const store = createFrnlStore();
    store.getState().registerEntity('submitBtn', {
      kind: 'primitive',
      state: 'default',
      properties: {},
    });
    store.getState().registerSlot('form.action', {
      id: 'form.action',
      address: 'LoginForm.action',
      occupantId: 'submitBtn',
      occupantKind: 'primitive',
      properties: {},
    });

    store.getState().setEntityState('submitBtn', 'loading');

    const slotStateEvent = store.getState().events.find((e) => e.type === 'slot.stateChanged');
    expect(slotStateEvent).toBeDefined();
    expect(slotStateEvent?.payload).toMatchObject({
      slotId: 'form.action',
      address: 'LoginForm.action',
      occupantId: 'submitBtn',
      previousState: 'default',
      state: 'loading',
    });
  });

  it('supports repeatable slot collections and dynamic cardinality changes', () => {
    const store = createFrnlStore();
    store.getState().registerSlotCollection('items', {
      address: 'Dashboard.items',
      slotIds: ['item.0', 'item.1'],
    });

    expect(store.getState().slotCollections.items.slotIds).toEqual(['item.0', 'item.1']);

    store.getState().addSlotToCollection('items', 'item.2');
    expect(store.getState().slotCollections.items.slotIds).toEqual(['item.0', 'item.1', 'item.2']);

    store.getState().removeSlotFromCollection('items', 'item.0');
    expect(store.getState().slotCollections.items.slotIds).toEqual(['item.1', 'item.2']);

    expect(store.getState().events.filter((e) => e.type === 'slot.collectionChanged')).toHaveLength(2);
  });

  it('supports flow triggering and event observation', () => {
    const store = createFrnlStore();
    store.getState().registerEntity('loginForm', {
      kind: 'composite',
      state: 'idle',
      properties: {},
    });

    store.getState().triggerFlow('authFlow', 'loginForm', 'submit.click', { user: 'admin' });

    expect(store.getState().events.at(-1)).toMatchObject({
      type: 'flow.triggered',
      payload: {
        flowId: 'authFlow',
        compositeId: 'loginForm',
        trigger: 'submit.click',
        payload: { user: 'admin' },
      },
    });
  });
});

describe('FrnlTS Zod validation boundaries', () => {
  it('rejects invalid entity registration payloads', () => {
    const store = createFrnlStore();
    expect(() =>
      store.getState().registerEntity('', {
        kind: 'primitive',
        state: 'default',
        properties: {},
      })
    ).toThrow();
  });

  it('rejects invalid slot occupant payloads', () => {
    const store = createFrnlStore();
    store.getState().registerSlot('content', {
      id: 'content',
      address: 'Page.content',
      occupantId: 'overview',
      occupantKind: 'composite',
      properties: {},
    });
    expect(() =>
      store.getState().replaceSlotOccupant('content', {
        id: '',
        kind: 'primitive',
      })
    ).toThrow();
  });

  it('rejects malformed injected event payloads', () => {
    const store = createFrnlStore();
    expect(() =>
      store.getState().emit({
        type: 'entity.stateChanged',
        payload: { entityId: '', previousState: 'default', state: 'pressed' },
      })
    ).toThrow();
    expect(store.getState().events).toHaveLength(0);
  });

  it('validates emitted event payloads', () => {
    const store = createFrnlStore();
    store.getState().registerEntity('button', {
      kind: 'primitive',
      state: 'default',
      properties: {},
    });
    store.getState().setEntityState('button', 'pressed');
    expect(store.getState().events.find((e) => e.type === 'entity.stateChanged')).toMatchObject({
      type: 'entity.stateChanged',
      payload: { entityId: 'button', previousState: 'default', state: 'pressed' },
    });
  });

  it('rejects invalid initial store state', () => {
    expect(() =>
      createFrnlStore({
        entities: {
          badEntity: {
            kind: 'invalidKind' as any,
            state: 'default',
            properties: {},
          },
        },
      })
    ).toThrow();
  });
});
