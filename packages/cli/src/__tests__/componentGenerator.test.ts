import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { generateComponent } from '../generators/componentGenerator.js';

describe('Frnl component generator', () => {
  it('generates a complete deterministic component scaffold', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'frnl-'));
    const dir = generateComponent('Button', root, { states: ['Idle', 'Loading'], events: ['Click', 'Focus'] });
    const expected = [
      'Button.tsx',
      'definition.ts',
      'events.ts',
      'index.ts',
      'States/Idle/state.ts',
      'States/Idle/VisualParameters.ts',
      'States/Idle/Events/Click.ts',
      'States/Idle/Events/Focus.ts',
      'States/Loading/state.ts',
      'States/Loading/VisualParameters.ts',
      'States/Loading/Events/Click.ts',
      'States/Loading/Events/Focus.ts',
      'Libraries/functions/index.ts',
      'Libraries/data/index.ts',
      'Libraries/structs/index.ts',
      'Libraries/index.ts',
    ];
    for (const relative of expected) expect(fs.existsSync(path.join(dir, relative))).toBe(true);
  });
});
