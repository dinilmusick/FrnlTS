import { describe, expect, it } from 'vitest';
import { createFrnlStore } from '../src/runtime/store.js';

describe('FrnlTS React asset runtime contracts', () => {
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
});
