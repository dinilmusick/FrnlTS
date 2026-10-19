import { defineFrnlElement } from '../../../../src/elements/definition.js';
import { clickEvent } from './states/idle/events/click.js';
import { visualDefinition as attackVisualDefinition } from './states/idle/phases/attackPhase/visualDefinition.js';
import { visualDefinition as sustainVisualDefinition } from './states/idle/phases/sustainPhase/visualDefinition.js';
import { visualDefinition as releaseVisualDefinition } from './states/idle/phases/releasePhase/visualDefinition.js';

export const exampleButton = defineFrnlElement({
  name: 'exampleButton',
  kind: 'primitive',
  states: {
    idle: {
      name: 'idle',
      events: { click: clickEvent },
      visualParameters: { opacity: 1 },
      phases: {
        attackPhase: { visualDefinition: attackVisualDefinition },
        sustainPhase: { visualDefinition: sustainVisualDefinition },
        releasePhase: { visualDefinition: releaseVisualDefinition },
      },
    },
  },
});
