import type { StoreApi } from 'zustand/vanilla';
import type { FrnlState } from './store.js';
import { getFrnlComponentHandle, getFrnlEvent, type FrnlComponentHandle, type FrnlEventHandler } from './events.js';
import { getFrnlLibrary } from './libraries.js';

export class FrnlFacade {
  constructor(readonly store: StoreApi<FrnlState>) {}

  component(componentId: string): FrnlComponentHandle {
    return getFrnlComponentHandle(this.store, componentId);
  }

  event(componentId: string, eventName: string): FrnlEventHandler {
    return getFrnlEvent(this.store, componentId, eventName);
  }

  library<T = unknown>(address: string): T {
    return getFrnlLibrary<T>(this.store, address);
  }
}

export function createFrnlFacade(store: StoreApi<FrnlState>): FrnlFacade {
  return new FrnlFacade(store);
}
