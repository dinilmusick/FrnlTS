import type { StoreApi } from 'zustand/vanilla';
import type { FrnlComponentDefinition } from './component-definition.js';
import { getFrnlVisualParameters, invokeFrnlEvent } from './events.js';
import type { FrnlState } from './store.js';

export type FrnlFrontendApiOptions = {
  readonly applicationId?: string;
  readonly route?: string;
};

export type FrnlComponentControl = {
  readonly id: string;
  readonly kind: 'event' | 'setState' | 'setVisualParameter' | 'applyTheme';
  readonly available: boolean;
  readonly invoke: (payload?: unknown) => unknown | Promise<unknown>;
};

export type FrnlComponentSnapshot = {
  readonly id: string;
  readonly type: string;
  readonly path: readonly string[];
  readonly parentId?: string;
  readonly rendered: boolean;
  readonly lifecycle: {
    readonly mounted: boolean;
    readonly rendered: boolean;
    readonly mountedAt?: number;
    readonly renderedAt?: number;
  };
  readonly state: string;
  readonly properties: Readonly<Record<string, unknown>>;
  readonly visualParameters: Readonly<Record<string, unknown>>;
  readonly controls: Readonly<Record<string, FrnlComponentControl>>;
  readonly events: readonly string[];
  readonly children: readonly string[];
};

export type FrnlFrontendSnapshot = {
  readonly apiVersion: 1;
  readonly application: {
    readonly id?: string;
    readonly route?: string;
  };
  readonly componentCount: number;
  readonly components: readonly FrnlComponentSnapshot[];
  readonly tree: readonly FrnlComponentSnapshot[];
  readonly events: readonly FrnlState['events'];
  readonly libraries: readonly string[];
};

export type FrnlFrontendApi = {
  readonly inspect: () => FrnlFrontendSnapshot;
  readonly inspectComponent: (componentId: string) => FrnlComponentSnapshot;
  readonly component: (componentId: string) => {
    readonly inspect: () => FrnlComponentSnapshot;
    readonly invoke: (controlId: string, payload?: unknown) => unknown | Promise<unknown>;
  };
  readonly invoke: (componentId: string, controlId: string, payload?: unknown) => unknown | Promise<unknown>;
};

function componentPath(store: StoreApi<FrnlState>, componentId: string): string[] {
  const current = store.getState();
  const path: string[] = [];
  const seen = new Set<string>();
  let cursor: string | undefined = componentId;

  while (cursor) {
    if (seen.has(cursor)) throw new Error(`Circular Frnl component scope detected at: ${cursor}`);
    seen.add(cursor);
    path.unshift(cursor);
    cursor = current.componentParents[cursor];
  }

  return path;
}

function eventNames(definition: FrnlComponentDefinition): string[] {
  const names = new Set<string>();
  for (const state of Object.values(definition.states)) {
    for (const name of Object.keys(state.events)) names.add(name);
  }
  return [...names].sort();
}

function childrenOf(store: StoreApi<FrnlState>, componentId: string): string[] {
  return Object.entries(store.getState().componentParents)
    .filter(([, parentId]) => parentId === componentId)
    .map(([id]) => id)
    .sort();
}

function snapshotFor(
  store: StoreApi<FrnlState>,
  componentId: string,
  mountedAt: number | undefined,
): FrnlComponentSnapshot {
  const current = store.getState();
  const entity = current.entities[componentId];
  const definition = current.componentDefinitions[componentId];

  if (!entity || !definition) {
    throw new Error(`Unknown Frnl component: ${componentId}`);
  }

  const names = eventNames(definition);
  const controls: Record<string, FrnlComponentControl> = {};

  for (const name of names) {
    const eventDefinition = definition.states[entity.state]?.events[name];
    controls[name] = {
      id: name,
      kind: 'event',
      available: Boolean(eventDefinition && current.eventHandlers[componentId]?.[eventDefinition.functionId]),
      invoke: (payload) => invokeFrnlEvent(store, componentId, name, payload),
    };
  }

  controls.setState = {
    id: 'setState',
    kind: 'setState',
    available: true,
    invoke: (payload) => {
      if (typeof payload !== 'string') throw new TypeError('setState expects a string payload');
      current.setEntityState(componentId, payload);
    },
  };

  controls.setVisualParameter = {
    id: 'setVisualParameter',
    kind: 'setVisualParameter',
    available: true,
    invoke: (payload) => {
      if (!payload || typeof payload !== 'object') {
        throw new TypeError('setVisualParameter expects { parameter, value }');
      }
      const input = payload as { parameter?: unknown; value?: unknown };
      if (typeof input.parameter !== 'string' || !input.parameter) {
        throw new TypeError('setVisualParameter.parameter must be a non-empty string');
      }
      current.setVisualOverride(componentId, input.parameter, input.value);
    },
  };

  controls.applyTheme = {
    id: 'applyTheme',
    kind: 'applyTheme',
    available: Object.keys(current.themes).length > 0,
    invoke: (payload) => {
      if (typeof payload !== 'string') throw new TypeError('applyTheme expects a theme name');
      current.applyTheme(componentId, payload);
    },
  };

  return {
    id: componentId,
    type: definition.name,
    path: Object.freeze(componentPath(store, componentId)),
    parentId: current.componentParents[componentId],
    rendered: true,
    lifecycle: {
      mounted: true,
      rendered: true,
      mountedAt,
      renderedAt: mountedAt,
    },
    state: entity.state,
    properties: Object.freeze({ ...entity.properties }),
    visualParameters: Object.freeze({ ...getFrnlVisualParameters(store, componentId) }),
    controls: Object.freeze(controls),
    events: Object.freeze(names),
    children: Object.freeze(childrenOf(store, componentId)),
  };
}

export function createFrnlFrontendApi(
  store: StoreApi<FrnlState>,
  options: FrnlFrontendApiOptions = {},
): FrnlFrontendApi {
  const mountedAt = new Map<string, number>();
  for (const id of Object.keys(store.getState().entities)) mountedAt.set(id, Date.now());

  const unsubscribe = store.subscribe((state) => {
    const now = Date.now();
    for (const id of Object.keys(state.entities)) {
      if (!mountedAt.has(id)) mountedAt.set(id, now);
    }
    for (const id of [...mountedAt.keys()]) {
      if (!state.entities[id]) mountedAt.delete(id);
    }
  });

  const inspectComponent = (componentId: string) => snapshotFor(store, componentId, mountedAt.get(componentId));

  const inspect = (): FrnlFrontendSnapshot => {
    const current = store.getState();
    const components = Object.keys(current.entities)
      .filter((id) => current.componentDefinitions[id])
      .sort()
      .map((id) => snapshotFor(store, id, mountedAt.get(id)));

    return {
      apiVersion: 1,
      application: {
        id: options.applicationId,
        route: options.route ?? (typeof window === 'undefined' ? undefined : window.location.pathname),
      },
      componentCount: components.length,
      components: Object.freeze(components),
      tree: Object.freeze(components.filter((component) => !component.parentId)),
      events: Object.freeze([...current.events]),
      libraries: Object.freeze(Object.keys(current.libraries).sort()),
    };
  };

  const invoke = (componentId: string, controlId: string, payload?: unknown) => {
    const control = inspectComponent(componentId).controls[controlId];
    if (!control) throw new Error(`Frnl control not found: ${componentId}.${controlId}`);
    if (!control.available) throw new Error(`Frnl control unavailable: ${componentId}.${controlId}`);
    return control.invoke(payload);
  };

  void unsubscribe;

  return Object.freeze({
    inspect,
    inspectComponent,
    component: (componentId) => Object.freeze({
      inspect: () => inspectComponent(componentId),
      invoke: (controlId, payload) => invoke(componentId, controlId, payload),
    }),
    invoke,
  });
}

export function installFrnlFrontendApi(
  api: FrnlFrontendApi,
  globalKey = '__FRNL_FRONTEND_API__',
): void {
  if (typeof globalThis === 'undefined') return;
  Object.defineProperty(globalThis, globalKey, {
    configurable: true,
    enumerable: false,
    get: () => api,
  });
}
