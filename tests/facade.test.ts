import { describe, expect, it } from 'vitest';
import { defineFrnlElement } from '../src/elements/definition.js';
import { createFrnlFacade, createFrnlStore, getFrnlVisualParameters } from '../src/runtime/index.js';

const testDefinition = defineFrnlElement({
  name: 'Button',
  kind: 'primitive',
  states: {
    Idle: {
      name: 'Idle',
      visualParameters: { opacity: 1 },
      events: { click: { functionId: 'Button.Idle.click' } },
      phases: {
        attackPhase: { visualDefinition: { parameters: {} } },
        sustainPhase: { visualDefinition: { parameters: {} } },
        releasePhase: { visualDefinition: { parameters: {} } },
      },
    },
    Active: {
      name: 'Active',
      visualParameters: { opacity: 0.8 },
      events: { click: { functionId: 'Button.Active.click' } },
      phases: {
        attackPhase: { visualDefinition: { parameters: {} } },
        sustainPhase: { visualDefinition: { parameters: {} } },
        releasePhase: { visualDefinition: { parameters: {} } },
      },
    },
  },
});

describe('Frnl facade', () => {
  it('provides central access to registered libraries and component events', () => {
    const store = createFrnlStore();
    store.getState().registerLibrary('Button.functions', { run: () => 'ok' });
    const facade = createFrnlFacade(store);
    expect(facade.library<{ run: () => string }>('Button.functions').run()).toBe('ok');
  });

  it('applies a theme through the component handle and aggregates the same operation across components', () => {
    const store = createFrnlStore();
    store.getState().registerEntity('btn-1', { kind: 'primitive', state: 'Idle', properties: {} });
    store.getState().registerEntity('btn-2', { kind: 'primitive', state: 'Idle', properties: {} });
    store.getState().registerElementDefinition('btn-1', testDefinition);
    store.getState().registerElementDefinition('btn-2', testDefinition);

    const facade = createFrnlFacade(store);
    facade.registerTheme('Dark', {
      Button: { states: { Idle: { visualParameters: { opacity: 0.4 } } } },
    });

    facade.component('btn-1').applyTheme('Dark');
    expect(getFrnlVisualParameters(store, 'btn-1').opacity).toBe(0.4);

    facade.applyThemeToAllComponents('Dark');
    expect(getFrnlVisualParameters(store, 'btn-1').opacity).toBe(0.4);
    expect(getFrnlVisualParameters(store, 'btn-2').opacity).toBe(0.4);
  });

  it('provides component handles, event triggers, and scoped visual parameter mutation', () => {
    const store = createFrnlStore();
    store.getState().registerEntity('btn-1', { kind: 'primitive', state: 'Idle', properties: {} });
    store.getState().registerElementDefinition('btn-1', testDefinition);
    store.getState().registerEventHandlers('btn-1', {
      'Button.Idle.click': (_payload, context) => {
        context.setState('Active');
        return 'transitioned';
      },
      'Button.Active.click': () => 'already-active',
    });

    const facade = createFrnlFacade(store);

    // Test facade.component
    const handle = facade.component('btn-1');
    expect(handle.address.componentId).toBe('btn-1');

    // Test facade.event
    const trigger = facade.event('btn-1', 'click');
    const result = trigger();
    expect(result).toBe('transitioned');
    expect(store.getState().entities['btn-1'].state).toBe('Active');

    // Test facade.setVisualParameter
    facade.setVisualParameter('btn-1.scale', 1.05);
    expect(getFrnlVisualParameters(store, 'btn-1').scale).toBe(1.05);
  });
});
