import * as fs from 'node:fs';
import * as path from 'node:path';
import type { FrnlValidationDiagnostic } from './types.js';

function files(root: string): string[] {
  const result: string[] = [];
  const ignored = new Set(['node_modules', '.git', 'dist', 'build', '.next']);
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (ignored.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) result.push(full);
    }
  };
  walk(root);
  return result;
}

export function checkComponentScaffolds(root: string): FrnlValidationDiagnostic[] {
  const diagnostics: FrnlValidationDiagnostic[] = [];
  const components: string[] = [];
  const walk = (dir: string) => {
    if (path.basename(dir) === 'node_modules') return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (!entry.isDirectory()) continue;
      if (fs.existsSync(path.join(full, `${entry.name}.tsx`))) components.push(full);
      walk(full);
    }
  };
  walk(root);
  for (const component of components) {
    const states = path.join(component, 'States');
    const libraries = path.join(component, 'Libraries');
    if (!fs.existsSync(states)) diagnostics.push({ ruleId:'frnl/component-states-scaffold', filePath:component, message:'Frnl component is missing States/. Generate the component through the Frnl CLI.', severity:'error' });
    if (!fs.existsSync(libraries)) diagnostics.push({ ruleId:'frnl/component-libraries-scaffold', filePath:component, message:'Frnl component is missing Libraries/. Generate the component through the Frnl CLI.', severity:'error' });
    if (fs.existsSync(states)) {
      for (const state of fs.readdirSync(states, {withFileTypes:true}).filter(e=>e.isDirectory())) {
        const events = path.join(states, state.name, 'Events');
        if (!fs.existsSync(events)) diagnostics.push({ruleId:'frnl/state-events-scaffold',filePath:path.join(states,state.name),message:`State '${state.name}' is missing Events/.`,severity:'error'});
      }
    }
  }
  return diagnostics;
}

export function collectWorkspaceFiles(root: string): string[] {
  return files(root);
}
