import { useEffect, useMemo, useRef } from 'react';
import { useStore } from 'zustand';
import type { StoreApi } from 'zustand/vanilla';
import type { FrnlElementDefinition } from '../elements/definition.js';
import type { FrnlState } from '../runtime/store.js';
import { getFrnlEvent } from '../runtime/events.js';

export interface UseFrnlComponentOptions {
  id: string;
  definition: FrnlElementDefinition;
  store: StoreApi<FrnlState>;
  state?: string;
  properties?: Record<string, unknown>;
  bounds?: { width?: number | string; height?: number | string };
  handlers: Record<string, (payload: unknown) => unknown>;
}

export function useFrnlComponent({
  id,
  definition,
  store,
  state,
  properties = {},
  bounds,
  handlers,
}: UseFrnlComponentOptions) {
  const initialState = state ?? Object.keys(definition.states)[0] ?? 'default';
  const previousProps = useRef({ state: initialState, properties, bounds });
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    store.getState().registerEntity(id, {
      kind: definition.kind,
      state: initialState,
      properties,
      bounds,
    });
    store.getState().registerElementDefinition(id, definition);
  }, [id, definition, store]);

  useEffect(() => {
    const current = store.getState().entities[id];
    if (!current) return;

    const previous = previousProps.current;
    if (state !== undefined && state !== previous.state && current.state !== state) {
      store.getState().setEntityState(id, state);
    }

    if (properties !== previous.properties) {
      store.getState().setEntityProperties(id, properties);
    }

    if (bounds !== previous.bounds) {
      store.getState().setEntityBounds(id, bounds);
    }

    previousProps.current = { state: state ?? initialState, properties, bounds };
  }, [id, state, properties, bounds, initialState, store]);

  useEffect(() => {
    store.getState().registerEventHandlers(id, handlers);
    return () => store.getState().unregisterEventHandlers(id);
  }, [id, handlers, store]);

  const entity = useStoreState(store, id);
  const events = useMemo(() => {
    const names = new Set<string>();
    for (const stateDefinition of Object.values(definition.states)) {
      Object.keys(stateDefinition.events).forEach((name) => names.add(name));
    }

    return Object.fromEntries(
      [...names].map((name) => [name, getFrnlEvent(store, id, name)]),
    ) as Record<string, (payload: unknown) => unknown>;
  }, [definition, id, store]);

  return {
    state: entity?.state ?? initialState,
    properties: entity?.properties ?? properties,
    events,
  };
}

function useStoreState(store: StoreApi<FrnlState>, id: string) {
  // React's useSyncExternalStore is used through Zustand's vanilla-compatible hook.
  return useStore(store, (current: FrnlState) => current.entities[id]);
}
