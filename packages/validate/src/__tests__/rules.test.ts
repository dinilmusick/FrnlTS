import { describe, expect, it } from 'vitest';
import { checkComponentRules } from '../rules/componentRules.js';
import { checkFileLimits, FRNL_COMPONENT_MAX_LINES } from '../rules/fileLimits.js';

describe('Frnl structural validation', () => {
  it('rejects multiple React components in one file', () => {
    const source = `export function A(){ return <div/>; }\nexport function B(){ return <span/>; }`;
    expect(checkComponentRules('A.tsx', source).some((d) => d.ruleId === 'frnl/one-component-per-file')).toBe(true);
  });

  it('rejects a nested component declaration', () => {
    const source = `export function A(){ function B(){ return <span/>; } return <B/>; }`;
    expect(checkComponentRules('A.tsx', source).some((d) => d.ruleId === 'frnl/no-nested-component-declaration')).toBe(true);
  });

  it('enforces the component hard line limit below 200', () => {
    const source = Array.from({ length: FRNL_COMPONENT_MAX_LINES + 1 }, () => 'x').join('\n');
    expect(checkFileLimits('A.tsx', source).some((d) => d.ruleId === 'frnl/component-line-limit')).toBe(true);
  });
});
