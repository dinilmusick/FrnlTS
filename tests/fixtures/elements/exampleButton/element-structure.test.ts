import { describe, expect, it } from 'vitest';
import { exampleButton } from './exampleButton.js';

describe('concrete Frnl Element folder structure', () => {
  it('assembles the facade from state-local event and phase modules', () => {
    expect(exampleButton).toMatchObject({
      name: 'exampleButton',
      kind: 'primitive',
      states: {
        idle: {
          events: { click: { functionId: 'exampleButton.idle.click' } },
          phases: {
            attackPhase: { visualDefinition: { parameters: { opacity: 0 } } },
            sustainPhase: { visualDefinition: { parameters: { opacity: 1 } } },
            releasePhase: { visualDefinition: { parameters: { opacity: 0 } } },
          },
        },
      },
    });
  });
});
