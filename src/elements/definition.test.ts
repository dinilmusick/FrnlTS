import { describe, expect, it } from 'vitest';
import {
  defineFrnlElement,
  frnlElementDefinitionSchema,
  type FrnlElementDefinition,
} from './definition.js';

const state = (functionId: string) => ({
  name: 'idle',
  events: {
    click: { functionId },
  },
  phases: {
    attackPhase: { visualDefinition: { parameters: { opacity: 0 } } },
    sustainPhase: { visualDefinition: { parameters: { opacity: 1 } } },
    releasePhase: { visualDefinition: { parameters: { opacity: 0 } } },
  },
});

describe('Frnl element definitions', () => {
  it('defines Primitive and Composite as independent Element kinds', () => {
    const primitive = defineFrnlElement({
      name: 'button',
      kind: 'primitive',
      states: { idle: state('button.click') },
    });

    const composite = defineFrnlElement({
      name: 'form',
      kind: 'composite',
      states: { idle: state('form.submit') },
    });

    expect(primitive.kind).toBe('primitive');
    expect(composite.kind).toBe('composite');
  });

  it('keeps events inside each named state', () => {
    const definition: FrnlElementDefinition = {
      name: 'button',
      kind: 'primitive',
      states: {
        idle: state('button.idle.click'),
        loading: {
          ...state('button.loading.click'),
          name: 'loading',
        },
      },
    };

    expect(definition.states.idle.events.click.functionId).toBe('button.idle.click');
    expect(definition.states.loading.events.click.functionId).toBe('button.loading.click');
  });

  it('requires all three phases and visual definitions', () => {
    const result = frnlElementDefinitionSchema.safeParse({
      name: 'button',
      kind: 'primitive',
      states: {
        idle: {
          name: 'idle',
          events: {},
          phases: {
            attackPhase: { visualDefinition: { parameters: {} } },
            sustainPhase: { visualDefinition: { parameters: {} } },
            releasePhase: { visualDefinition: { parameters: {} } },
          },
        },
      },
    });

    expect(result.success).toBe(true);
  });

  it('rejects an incomplete phase model', () => {
    const result = frnlElementDefinitionSchema.safeParse({
      name: 'button',
      kind: 'primitive',
      states: {
        idle: {
          name: 'idle',
          events: {},
          phases: {
            attackPhase: { visualDefinition: { parameters: {} } },
            sustainPhase: { visualDefinition: { parameters: {} } },
          },
        },
      },
    });

    expect(result.success).toBe(false);
  });
});
