import { describe, expect, it } from 'vitest';
import { createFrnlStore } from '../src/runtime/store.js';
import { defineFrnlElement } from '../src/elements/definition.js';
import {
  applyFrnlTheme,
  getFrnlComponentTheme,
  registerFrnlTheme,
  resolveFrnlVisualParameters,
} from '../src/runtime/themes.js';
import { getFrnlVisualParameters, setFrnlVisualParameter } from '../src/runtime/events.js';

const definition = defineFrnlElement({
  name: 'Button',
  kind: 'primitive',
  states: {
    Idle: {
      name: 'Idle',
      visualParameters: { opacity: 1, scale: 1 },
      events: { click: { functionId: 'Button.Idle.click' } },
      phases: {
        attackPhase: { visualDefinition: { parameters: {} } },
        sustainPhase: { visualDefinition: { parameters: {} } },
        releasePhase: { visualDefinition: { parameters: {} } },
      },
    },
    Pressed: {
      name: 'Pressed',
      visualParameters: { opacity: 0.8, scale: 0.98 },
      events: { click: { functionId: 'Button.Pressed.click' } },
      phases: {
        attackPhase: { visualDefinition: { parameters: {} } },
        sustainPhase: { visualDefinition: { parameters: {} } },
        releasePhase: { visualDefinition: { parameters: {} } },
      },
    },
  },
});

describe('Frnl component themes', () => {
  it('applies component/state theme values over state fallbacks', () => {
    const store = createFrnlStore();
    store.getState().registerEntity('button', { kind: 'primitive', state: 'Idle', properties: {} });
    store.getState().registerElementDefinition('button', definition);
    registerFrnlTheme(store, 'Dark', {
      Button: {
        states: {
          Idle: { visualParameters: { opacity: 0.4 } },
        },
      },
    });

    applyFrnlTheme(store, 'button', 'Dark');

    expect(resolveFrnlVisualParameters(store, 'button')).toEqual({ opacity: 0.4, scale: 1 });
    expect(getFrnlVisualParameters(store, 'button')).toEqual({ opacity: 0.4, scale: 1 });
    expect(getFrnlComponentTheme(store, 'button')).toBe('Dark');
  });

  it('falls back when a theme omits the component or current state', () => {
    const store = createFrnlStore();
    store.getState().registerEntity('button', { kind: 'primitive', state: 'Pressed', properties: {} });
    store.getState().registerElementDefinition('button', definition);
    registerFrnlTheme(store, 'Dark', {
      Button: { states: { Idle: { visualParameters: { opacity: 0.4 } } } },
    });

    applyFrnlTheme(store, 'button', 'Dark');

    expect(resolveFrnlVisualParameters(store, 'button')).toEqual({ opacity: 0.8, scale: 0.98 });
  });

  it('keeps the selected theme across state changes and clears surgical overrides', () => {
    const store = createFrnlStore();
    store.getState().registerEntity('button', { kind: 'primitive', state: 'Idle', properties: {} });
    store.getState().registerElementDefinition('button', definition);
    registerFrnlTheme(store, 'Dark', {
      Button: {
        states: {
          Idle: { visualParameters: { opacity: 0.4 } },
          Pressed: { visualParameters: { opacity: 0.2 } },
        },
      },
    });

    applyFrnlTheme(store, 'button', 'Dark');
    setFrnlVisualParameter(store, 'button.opacity', 0.1);
    store.getState().setEntityState('button', 'Pressed');

    expect(getFrnlComponentTheme(store, 'button')).toBe('Dark');
    expect(resolveFrnlVisualParameters(store, 'button')).toEqual({ opacity: 0.2, scale: 0.98 });
  });

  it('clears surgical overrides when a component applies a new theme', () => {
    const store = createFrnlStore();
    store.getState().registerEntity('button', { kind: 'primitive', state: 'Idle', properties: {} });
    store.getState().registerElementDefinition('button', definition);
    registerFrnlTheme(store, 'Dark', {
      Button: { states: { Idle: { visualParameters: { opacity: 0.4 } } } },
    });
    registerFrnlTheme(store, 'Light', {
      Button: { states: { Idle: { visualParameters: { opacity: 0.9 } } } },
    });

    applyFrnlTheme(store, 'button', 'Dark');
    setFrnlVisualParameter(store, 'button.opacity', 0.1);
    applyFrnlTheme(store, 'button', 'Light');

    expect(resolveFrnlVisualParameters(store, 'button')).toEqual({ opacity: 0.9, scale: 1 });
  });

  it('rejects applying an unregistered theme', () => {
    const store = createFrnlStore();
    store.getState().registerEntity('button', { kind: 'primitive', state: 'Idle', properties: {} });
    store.getState().registerElementDefinition('button', definition);

    expect(() => applyFrnlTheme(store, 'button', 'Missing')).toThrow('Unknown Frnl theme');
  });
});
