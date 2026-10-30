import { describe, expect, it, vi } from 'vitest';
import { createFrnlStore } from '../src/runtime/store.js';
import { createFrnlFrontendApi } from '../src/runtime/frontend-api.js';
import { defineFrnlComponent } from '../src/runtime/component-definition.js';

const definition = defineFrnlComponent({
  name: 'Button',
  states: {
    default: {
      visualDefinition: undefined,
    } as never,
  },
});

const buttonDefinition = defineFrnlComponent({
  name: 'Button',
  states: {
    idle: {
      visualDefinition: { parameters: {} },
      events: { click: { functionId: 'click' } },
      phases: { sustainPhase: { visualDefinition: { parameters: {} } } },
      visualParameters: {},
    },
  },
});

describe('Frnl frontend API', () => {
  it('exposes rendered components, properties, state and generated controls', () => {
    const store = createFrnlStore();
    const click = vi.fn();
    store.getState().registerEntity('create', {
      state: 'idle',
      properties: { label: 'Create Service', disabled: false },
    });
    store.getState().registerComponentDefinition('create', buttonDefinition);
    store.getState().registerEventHandlers('create', { click });

    const api = createFrnlFrontendApi(store, { applicationId: 'demo', route: '/workspace' });
    const snapshot = api.inspect();

    expect(snapshot.componentCount).toBe(1);
    expect(snapshot.application).toEqual({ id: 'demo', route: '/workspace' });
    expect(snapshot.components[0].rendered).toBe(true);
    expect(snapshot.components[0].properties.label).toBe('Create Service');
    expect(snapshot.components[0].controls.click.available).toBe(true);
  });

  it('invokes component controls without application-authored API glue', () => {
    const store = createFrnlStore();
    const click = vi.fn();
    store.getState().registerEntity('create', { state: 'idle', properties: {} });
    store.getState().registerComponentDefinition('create', buttonDefinition);
    store.getState().registerEventHandlers('create', { click });

    const api = createFrnlFrontendApi(store);
    api.invoke('create', 'click');

    expect(click).toHaveBeenCalledTimes(1);
  });

  it('returns hierarchical component paths and children', () => {
    const store = createFrnlStore();
    store.getState().registerEntity('page', { state: 'idle', properties: {} });
    store.getState().registerComponentDefinition('page', buttonDefinition);
    store.getState().registerEntity('create', { state: 'idle', properties: {} });
    store.getState().registerComponentDefinition('create', buttonDefinition);
    store.getState().registerComponentParent('create', 'page');

    const api = createFrnlFrontendApi(store);
    const page = api.inspectComponent('page');
    const child = api.inspectComponent('create');

    expect(page.children).toEqual(['create']);
    expect(child.path).toEqual(['page', 'create']);
    expect(api.inspect().tree.map((item) => item.id)).toEqual(['page']);
  });
});
