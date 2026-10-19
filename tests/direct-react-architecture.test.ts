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
    expect(ReactExports.FrnlSlot).toBeDefined();
    expect('FrnlPrimitive' in ReactExports).toBe(false);
    expect('FrnlComposite' in ReactExports).toBe(false);
    expect('FrnlPrimitive' in RuntimeExports).toBe(false);
    expect('FrnlComposite' in RuntimeExports).toBe(false);
  });
});
