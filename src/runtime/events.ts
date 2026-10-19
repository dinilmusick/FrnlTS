import type { StoreApi } from 'zustand/vanilla';
import type { FrnlElementDefinition } from '../elements/definition.js';
import type { FrnlState } from './store.js';

export type FrnlEventHandler<TPayload = unknown, TResult = unknown> = (
  payload: TPayload,
) => TResult | Promise<TResult>;

export type FrnlEventInvocation = {
  componentId: string;
  eventName: string;
  state: string;
  functionId: string;
};

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

export function registerFrnlElement(
  store: StoreApi<FrnlState>,
  componentId: string,
  definition: FrnlElementDefinition,
): void {
  store.getState().registerElementDefinition(componentId, definition);
}
