import { describe, expect, it } from 'vitest';
import { createFrnlFacade, createFrnlStore } from '../src/runtime/index.js';

describe('Frnl facade', () => {
  it('provides central access to registered libraries and component events', () => {
    const store = createFrnlStore();
    store.getState().registerLibrary('Button.functions', { run: () => 'ok' });
    const facade = createFrnlFacade(store);
    expect(facade.library<{ run: () => string }>('Button.functions').run()).toBe('ok');
  });
});
