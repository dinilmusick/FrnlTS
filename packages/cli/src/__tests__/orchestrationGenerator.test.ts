import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { generateOrchestration } from '../generators/orchestrationGenerator.js';

describe('Frnl orchestration generator', () => {
  it('generates page-scoped orchestration scaffolds under pages/<page>/orchestrations', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'frnl-orch-'));
    const file = generateOrchestration('settings', 'SaveSettings', root);
    expect(file).toBe(path.join(root, 'pages', 'settings', 'orchestrations', 'SaveSettings.ts'));
    expect(fs.readFileSync(file, 'utf8')).toContain('defineFrnlOrchestration');
    expect(fs.readFileSync(file, 'utf8')).toContain("id: 'settings.SaveSettings'");
  });

  it('rejects non-PascalCase orchestration names', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'frnl-orch-invalid-'));
    expect(() => generateOrchestration('settings', 'saveSettings', root)).toThrow(/PascalCase/);
  });
});
