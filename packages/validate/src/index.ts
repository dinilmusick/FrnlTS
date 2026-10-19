import * as fs from 'node:fs';
import * as path from 'node:path';
import { checkComponentRules } from './rules/componentRules.js';
import { checkFileLimits, checkImportRules } from './rules/fileLimits.js';
import { checkComponentScaffolds, collectWorkspaceFiles } from './workspaceRules.js';
import type { FrnlValidationResult } from './types.js';

export type { FrnlValidationDiagnostic, FrnlValidationResult } from './types.js';
export { FRNL_COMPONENT_MAX_LINES, FRNL_EVENT_MAX_SUBSTANTIVE_LINES } from './rules/fileLimits.js';

export function validateFrnlWorkspace(root: string = process.cwd()): FrnlValidationResult {
  const errors = [];
  const warnings = [];
  for (const filePath of collectWorkspaceFiles(root)) {
    const source = fs.readFileSync(filePath, 'utf8');
    for (const diagnostic of [
      ...checkComponentRules(filePath, source),
      ...checkFileLimits(filePath, source),
      ...checkImportRules(filePath, source),
    ]) {
      (diagnostic.severity === 'error' ? errors : warnings).push(diagnostic);
    }
  }
  for (const diagnostic of checkComponentScaffolds(root)) {
    (diagnostic.severity === 'error' ? errors : warnings).push(diagnostic);
  }
  return { errors, warnings, filesChecked: collectWorkspaceFiles(root).length, passed: errors.length === 0 };
}

export function formatValidation(result: FrnlValidationResult): string {
  const lines = [...result.errors, ...result.warnings].map((d) => `${d.severity.toUpperCase()} ${d.ruleId} ${d.filePath}${d.line ? `:${d.line}` : ''} — ${d.message}`);
  lines.push(`Checked ${result.filesChecked} files. Errors: ${result.errors.length}. Warnings: ${result.warnings.length}.`);
  return lines.join('\n');
}
