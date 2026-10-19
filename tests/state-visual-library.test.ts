import { describe, expect, it } from 'vitest';
import { createFrnlStore } from '../src/runtime/store.js';
import { defineFrnlElement } from '../src/elements/definition.js';
import { getFrnlEvent, getFrnlVisualParameters, registerFrnlLibrary } from '../src/runtime/index.js';

const definition = defineFrnlElement({
  name: 'Button',
  kind: 'primitive',
  states: {
    Idle: {
      name: 'Idle',
      visualParameters: { opacity: 1, scale: 1 },
      events: { click: { functionId: 'Button.Idle.click' } },
      phases: {
        attackPhase: { visualDefinition: { parameters: {} } },
        sustainPhase: { visualDefinition: { parameters: {} } },
        releasePhase: { visualDefinition: { parameters: {} } },
      },
    },
    Loading: {
      name: 'Loading',
      visualParameters: { opacity: 0.5, scale: 0.98 },
      events: { click: { functionId: 'Button.Loading.click' } },
      phases: {
        attackPhase: { visualDefinition: { parameters: {} } },
        sustainPhase: { visualDefinition: { parameters: {} } },
        releasePhase: { visualDefinition: { parameters: {} } },
      },
    },
  },
});

describe('Frnl state-owned visuals and libraries', () => {
  it('clears surgical visual overrides whenever state changes', () => {
    const store = createFrnlStore();
    store.getState().registerEntity('button', { kind: 'primitive', state: 'Idle', properties: {} });
    store.getState().registerElementDefinition('button', definition);
    store.getState().setVisualOverride('button', 'opacity', 0.25);
    expect(getFrnlVisualParameters(store, 'button')).toMatchObject({ opacity: 0.25, scale: 1 });
    store.getState().setEntityState('button', 'Loading');
    expect(getFrnlVisualParameters(store, 'button')).toEqual({ opacity: 0.5, scale: 0.98 });
  });

  it('exposes component libraries centrally', () => {
    const store = createFrnlStore();
    registerFrnlLibrary(store, 'Button.functions', { run: () => 'ok' });
    expect(store.getState().libraries['Button.functions']).toBeDefined();
  });

  it('gives event functions controlled access to state transitions', () => {
    const store = createFrnlStore();
    store.getState().registerEntity('button', { kind: 'primitive', state: 'Idle', properties: {} });
    store.getState().registerElementDefinition('button', definition);
    store.getState().registerEventHandlers('button', {
      'Button.Idle.click': (_payload, context) => context.setState('Loading'),
      'Button.Loading.click': () => undefined,
    });
    getFrnlEvent(store, 'button', 'click')({});
    expect(store.getState().entities.button.state).toBe('Loading');
  });
});
