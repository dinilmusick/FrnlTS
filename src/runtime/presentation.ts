import type { FrnlComponentDefinition } from './component-definition.js';

export type FrnlPresentation = Readonly<{
  role?: string;
  label?: string;
  disabled: boolean;
  active: boolean;
  selected: boolean;
  loading: boolean;
}>;

function firstText(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

function firstFlag(fallback: boolean, ...values: unknown[]): boolean {
  for (const value of values) {
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
  }
  return fallback;
}

export function resolveFrnlPresentation(
  definition: FrnlComponentDefinition,
  properties: Readonly<Record<string, unknown>>,
  state: string,
): FrnlPresentation {
  return Object.freeze({
    role: firstText(properties.role, definition.presentation?.role),
    label: firstText(properties['aria-label'], properties.label, definition.presentation?.label),
    disabled: firstFlag(state === 'disabled', properties['aria-disabled'], properties.disabled),
    active: firstFlag(state === 'active', properties.active, properties.isActive),
    selected: firstFlag(state === 'selected', properties['aria-selected'], properties.selected, properties.isSelected),
    loading: firstFlag(state === 'loading', properties['aria-busy'], properties.loading, properties.isLoading),
  });
}
