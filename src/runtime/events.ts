import type { StoreApi } from 'zustand/vanilla';
import type { FrnlElementDefinition } from '../elements/definition.js';
import type { FrnlState } from './store.js';

export type FrnlEventHandler<TPayload = unknown, TResult = unknown> = (
  payload: TPayload,
) => TResult | Promise<TResult>;

export type FrnlComponentPath = readonly string[];

export type FrnlComponentAddress = {
  readonly path: FrnlComponentPath;
  readonly componentId: string;
};

export type FrnlEventInvocation = {
  componentId: string;
  path: FrnlComponentPath;
  eventName: string;
  state: string;
  functionId: string;
};

type EventName<TDefinition extends FrnlElementDefinition> =
  keyof TDefinition['states'][keyof TDefinition['states']]['events'] & string;

export type FrnlComponentHandle<TDefinition extends FrnlElementDefinition = FrnlElementDefinition> = {
  readonly address: FrnlComponentAddress;
  event<TEventName extends EventName<TDefinition>>(
    eventName: TEventName,
  ): FrnlEventHandler;
};

function resolveComponentPath(
  store: StoreApi<FrnlState>,
  componentId: string,
): FrnlComponentPath {
  const current = store.getState();
  const path: string[] = [];
  const seen = new Set<string>();
  let cursor: string | undefined = componentId;

  while (cursor) {
    if (seen.has(cursor)) {
      throw new Error(`Circular Frnl component scope detected at: ${cursor}`);
    }
    seen.add(cursor);
    path.unshift(cursor);
    cursor = current.componentParents[cursor];
  }

  return path;
}

export function invokeFrnlEvent<TPayload = unknown, TResult = unknown>(
  store: StoreApi<FrnlState>,
  componentId: string,
  eventName: string,
  payload: TPayload,
): TResult | Promise<TResult> {
  const current = store.getState();
  const entity = current.entities[componentId];
  if (!entity) throw new Error(`Unknown Frnl component: ${componentId}`);

  const definition = current.elementDefinitions[componentId];
  if (!definition) throw new Error(`No Frnl element definition registered for: ${componentId}`);

  const stateDefinition = definition.states[entity.state];
  if (!stateDefinition) {
    throw new Error(`Frnl component "${componentId}" has no definition for state "${entity.state}"`);
  }

  const eventDefinition = stateDefinition.events[eventName];
  if (!eventDefinition) {
    throw new Error(
      `Frnl component "${componentId}" has no event "${eventName}" in state "${entity.state}"`,
    );
  }

  const handler = current.eventHandlers[componentId]?.[eventDefinition.functionId];
  if (!handler) {
    throw new Error(
      `No handler registered for Frnl event function "${eventDefinition.functionId}" on "${componentId}"`,
    );
  }

  return handler(payload) as TResult | Promise<TResult>;
}

export function getFrnlEvent<TPayload = unknown, TResult = unknown>(
  store: StoreApi<FrnlState>,
  componentId: string,
  eventName: string,
): FrnlEventHandler<TPayload, TResult> {
  return (payload: TPayload) => invokeFrnlEvent<TPayload, TResult>(
    store,
    componentId,
    eventName,
    payload,
  );
}

export function getFrnlComponentHandle<TDefinition extends FrnlElementDefinition>(
  store: StoreApi<FrnlState>,
  componentId: string,
): FrnlComponentHandle<TDefinition> {
  const address: FrnlComponentAddress = {
    componentId,
    path: resolveComponentPath(store, componentId),
  };

  return {
    address,
    event: (eventName) => getFrnlEvent(store, componentId, eventName),
  };
}

export function getFrnlEventAtPath(
  store: StoreApi<FrnlState>,
  path: FrnlComponentPath,
  eventName: string,
): FrnlEventHandler {
  if (path.length === 0) throw new Error('Frnl component path cannot be empty');

  const current = store.getState();
  const componentId = path[path.length - 1];
  const actualPath = resolveComponentPath(store, componentId);

  if (actualPath.length !== path.length || actualPath.some((segment, index) => segment !== path[index])) {
    throw new Error(`Frnl component path does not match registered scope: ${path.join('.')}`);
  }

  return getFrnlEvent(store, componentId, eventName);
}

export function registerFrnlElement(
  store: StoreApi<FrnlState>,
  componentId: string,
  definition: FrnlElementDefinition,
  parentId?: string,
): void {
  store.getState().registerElementDefinition(componentId, definition);
  store.getState().registerComponentParent(componentId, parentId);
}
