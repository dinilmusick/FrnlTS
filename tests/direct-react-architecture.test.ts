import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import * as RootExports from '../src/index.js';
import * as RuntimeExports from '../src/runtime/index.js';
import * as ReactExports from '../src/react/index.js';

const here = dirname(fileURLToPath(import.meta.url));

describe('direct React component architecture', () => {
  it('has no legacy wrapper asset directories or documentation', () => {
    for (const path of [
      '../src/elements',
      '../docs/element-architecture.md',
      '../docs/ui-primitive.md',
      '../docs/concepts/ui-primitives.md',
      '../docs/concepts/ui-composites.md',
      '../tests/ui-composite-invariants.md',
      '../tests/fixtures/elements',
    ]) {
      expect(existsSync(resolve(here, path))).toBe(false);
    }
  });

  it('exposes the component definition contract without wrapper component classes', () => {
    expect(typeof RootExports.defineFrnlComponent).toBe('function');
    expect(typeof RuntimeExports.defineFrnlComponent).toBe('function');
    expect(ReactExports.useFrnlComponent).toBeDefined();
    expect('FrnlSlot' in ReactExports).toBe(false);
    expect('FrnlPrimitive' in ReactExports).toBe(false);
    expect('FrnlComposite' in ReactExports).toBe(false);
    expect('FrnlPrimitive' in RuntimeExports).toBe(false);
    expect('FrnlComposite' in RuntimeExports).toBe(false);
  });

  it('enforces component-only slot occupants and flow payloads without legacy kind/compositeId', () => {
    const store = RuntimeExports.createFrnlStore();
    expect('componentDefinitions' in store.getState()).toBe(true);
    expect('elementDefinitions' in store.getState()).toBe(false);
    expect('registerComponentDefinition' in store.getState()).toBe(true);
    expect('registerElementDefinition' in store.getState()).toBe(false);

    // Verify slotStateSchema has no occupantKind
    const slotState = RuntimeExports.slotStateSchema.parse({
      id: 'slot-1',
      address: 'container.slot',
      occupantId: 'child-1',
      properties: {},
    });
    expect('occupantKind' in slotState).toBe(false);

    // Verify flowTriggeredPayloadSchema uses componentId
    const flowPayload = RuntimeExports.flowTriggeredPayloadSchema.parse({
      flowId: 'flow-1',
      componentId: 'comp-1',
      trigger: 'click',
    });
    expect(flowPayload.componentId).toBe('comp-1');
    expect('compositeId' in flowPayload).toBe(false);

    // Verify entityStateSchema has no kind
    const entityState = RuntimeExports.entityStateSchema.parse({
      state: 'idle',
      properties: {},
    });
    expect('kind' in entityState).toBe(false);
  });
});
