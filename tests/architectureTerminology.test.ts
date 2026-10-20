import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('FrnlTS canonical architecture documentation', () => {
  const readme = readFileSync(resolve(process.cwd(), 'README.md'), 'utf8');

  it('does not advertise the retired slot hierarchy', () => {
    expect(readme).not.toMatch(/^## Slots$/m);
    expect(readme).not.toContain('slot changes');
  });

  it('states the direct React component model', () => {
    expect(readme).toContain('There is one component model.');
    expect(readme).toContain('useFrnlComponent()');
  });
});
