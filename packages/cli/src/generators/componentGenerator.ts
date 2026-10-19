import * as fs from 'node:fs';
import * as path from 'node:path';

export interface ComponentGenerationOptions {
  states?: string[];
  events?: string[];
}

const DEFAULT_STATE = 'Idle';
const DEFAULT_EVENT = 'Click';

function write(file: string, content: string): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

export function generateComponent(name: string, projectRoot: string, options: ComponentGenerationOptions = {}): string {
  if (!/^[A-Z][A-Za-z0-9]*$/.test(name)) throw new Error('Component name must be PascalCase.');
  const states = [...new Set(options.states?.length ? options.states : [DEFAULT_STATE])];
  const events = [...new Set(options.events?.length ? options.events : [DEFAULT_EVENT])];
  const componentDir = path.join(projectRoot, 'components', name);
  if (fs.existsSync(componentDir)) throw new Error(`Component already exists: ${componentDir}`);

  write(path.join(componentDir, `${name}.tsx`), `import type { ReactNode } from 'react';
import type { StoreApi } from 'zustand/vanilla';
import { useFrnlComponent } from '@dinilmusick/frnlts/react';
import { definition } from './definition.js';
import { eventHandlers } from './events.js';

export interface ${name}Props {
  id: string;
  store: StoreApi<any>;
  children?: ReactNode;
}

export function ${name}({ id, store, children }: ${name}Props) {
  const frnl = useFrnlComponent({
    id,
    definition,
    store,
    handlers: eventHandlers,
  });

  return (
    <div data-frnl-component="${name}" data-frnl-state={frnl.state}>
      {children}
    </div>
  );
}
`);

  const stateImports = states.map((state) => `import { ${state}State } from './States/${state}/state.js';`).join('\n');
  write(path.join(componentDir, 'definition.ts'), `import { defineFrnlElement } from '@dinilmusick/frnlts';
${stateImports}

export const definition = defineFrnlElement({
  name: '${name}',
  kind: 'primitive',
  states: {
${states.map((s) => `    ${s}: ${s}State,`).join('\n')}
  },
});
`);

  write(path.join(componentDir, 'events.ts'), states.flatMap((state) => events.map((event) => `import { ${state}${event} } from './States/${state}/Events/${event}.js';`)).join('\n') + `\n\nexport const eventHandlers = {
${states.flatMap((state) => events.map((event) => `  '${name}.${state}.${event}': ${state}${event},`)).join('\n')}
};
`);

  for (const state of states) {
    const eventDefs = events.map((event) => `    ${event}: { functionId: '${name}.${state}.${event}' },`).join('\n');
    write(path.join(componentDir, 'States', state, 'state.ts'), `import type { FrnlStateDefinition } from '@dinilmusick/frnlts';

export const ${state}State: FrnlStateDefinition = {
  name: '${state}',
  events: {
${eventDefs}
  },
  phases: {
    attackPhase: { visualDefinition: { parameters: {} } },
    sustainPhase: { visualDefinition: { parameters: {} } },
    releasePhase: { visualDefinition: { parameters: {} } },
  },
};
`);
    write(path.join(componentDir, 'States', state, 'VisualParameters.ts'), `export const ${state}VisualParameters = {} as const;
`);
    write(path.join(componentDir, 'States', state, 'Events', '.gitkeep'), '');
    for (const event of events) {
      write(path.join(componentDir, 'States', state, 'Events', `${event}.ts`), `export function ${state}${event}(payload: unknown): unknown {
  // Keep this state-specific event function intentionally small.
  // Delegate implementation to component Libraries.
  void payload;
}
`);
    }
  }

  for (const dir of ['functions', 'data', 'structs']) {
    write(path.join(componentDir, 'Libraries', dir, 'index.ts'), `// Component-local ${dir} library surface for ${name}.
`);
  }
  write(path.join(componentDir, 'Libraries', 'index.ts'), `export * from './functions/index.js';
export * from './data/index.js';
export * from './structs/index.js';
`);
  write(path.join(componentDir, 'index.ts'), `export { ${name} } from './${name}.js';
export { definition } from './definition.js';
`);

  return componentDir;
}
