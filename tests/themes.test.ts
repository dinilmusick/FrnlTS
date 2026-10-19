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

  it('falls back to state visuals when the theme omits the component entirely', () => {
    const store = createFrnlStore();
    store.getState().registerEntity('button', { kind: 'primitive', state: 'Idle', properties: {} });
    store.getState().registerElementDefinition('button', definition);
    registerFrnlTheme(store, 'Minimal', {
      OtherComponent: { states: { Idle: { visualParameters: { opacity: 0.2 } } } },
    });

    applyFrnlTheme(store, 'button', 'Minimal');

    expect(resolveFrnlVisualParameters(store, 'button')).toEqual({ opacity: 1, scale: 1 });
  });

  it('gives surgical instance overrides priority over theme values', () => {
    const store = createFrnlStore();
    store.getState().registerEntity('button', { kind: 'primitive', state: 'Idle', properties: {} });
    store.getState().registerElementDefinition('button', definition);
    registerFrnlTheme(store, 'Dark', {
      Button: { states: { Idle: { visualParameters: { opacity: 0.4, scale: 0.9 } } },
      },
    });

    applyFrnlTheme(store, 'button', 'Dark');
    setFrnlVisualParameter(store, 'button.opacity', 0.1);
    setFrnlVisualParameter(store, 'button.custom', 'instance');

    expect(resolveFrnlVisualParameters(store, 'button')).toEqual({
      opacity: 0.1,
      scale: 0.9,
      custom: 'instance',
    });
  });

  it('rejects themes that reference unknown states for registered element definitions', () => {
    const store = createFrnlStore();
    store.getState().registerEntity('button', { kind: 'primitive', state: 'Idle', properties: {} });
    store.getState().registerElementDefinition('button', definition);

    expect(() => registerFrnlTheme(store, 'Invalid', {
      Button: { states: { Missing: { visualParameters: { opacity: 0.3 } } } },
    })).toThrow('references unknown state "Missing"');
    expect(store.getState().themes.Invalid).toBeUndefined();
  });

  it('rejects applying an unregistered theme', () => {
    const store = createFrnlStore();
    store.getState().registerEntity('button', { kind: 'primitive', state: 'Idle', properties: {} });
    store.getState().registerElementDefinition('button', definition);

    expect(() => applyFrnlTheme(store, 'button', 'Missing')).toThrow('Unknown Frnl theme');
  });
});
