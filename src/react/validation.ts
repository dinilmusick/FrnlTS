import { z } from 'zod';
import type { ReactNode } from 'react';
import type { StoreApi } from 'zustand/vanilla';
import type { FrnlState } from '../runtime/store.js';
import { boundsSchema } from '../runtime/validation.js';

export const storeSchema = z.custom<StoreApi<FrnlState>>(
  (value) =>
    Boolean(
      value &&
        typeof value === 'object' &&
        typeof (value as { getState?: unknown }).getState === 'function' &&
        typeof (value as { subscribe?: unknown }).subscribe === 'function'
    ),
  { message: 'Expected a valid Zustand StoreApi with getState and subscribe methods.' }
);

export const reactNodeSchema = z.custom<ReactNode>(() => true);
export const elementTypeSchema = z.custom<unknown>((val) => {
  return typeof val === 'string' || typeof val === 'function' || (typeof val === 'object' && val !== null);
}, { message: 'Expected a valid React ElementType' });

export const primitivePropsSchema = z.object({
  id: z.string().min(1),
  bounds: boundsSchema,
  state: z.string().min(1).optional(),
  properties: z.record(z.string(), z.unknown()).optional(),
  children: reactNodeSchema.optional(),
  className: z.string().optional(),
  hostProps: z.record(z.string(), z.unknown()).optional(),
  style: z.record(z.string(), z.unknown()).optional(),
  store: storeSchema,
  as: elementTypeSchema.optional(),
});

export const compositePropsSchema = z.object({
  id: z.string().min(1),
  state: z.string().min(1).optional(),
  properties: z.record(z.string(), z.unknown()).optional(),
  slots: reactNodeSchema,
  className: z.string().optional(),
  style: z.record(z.string(), z.unknown()).optional(),
  store: storeSchema,
});

export const slotPropsSchema = z.object({
  id: z.string().min(1),
  address: z.string().min(1),
  occupantId: z.string().min(1),
  occupantKind: z.enum(['primitive', 'composite']),
  occupants: z.record(z.string(), reactNodeSchema),
  properties: z.record(z.string(), z.unknown()).optional(),
  store: storeSchema,
});
