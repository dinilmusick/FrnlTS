import { z } from 'zod';
import type { ReactNode } from 'react';
import type { StoreApi } from 'zustand/vanilla';
import type { FrnlState } from '../runtime/store.js';

const storeSchema = z.custom<StoreApi<FrnlState>>((value) => Boolean(value && typeof value === 'object'));
const reactNodeSchema = z.custom<ReactNode>(() => true);
const elementTypeSchema = z.custom<unknown>(() => true);
const boundsSchema = z.object({ width: z.union([z.string(), z.number()]).optional(), height: z.union([z.string(), z.number()]).optional() }).optional();

export const primitivePropsSchema = z.object({
  id: z.string().min(1), bounds: boundsSchema, state: z.string().min(1), properties: z.record(z.string(), z.unknown()),
  children: reactNodeSchema.optional(), className: z.string().optional(), hostProps: z.record(z.string(), z.unknown()).optional(), style: z.record(z.string(), z.unknown()).optional(), store: storeSchema, as: elementTypeSchema.optional(),
});
export const compositePropsSchema = z.object({
  id: z.string().min(1), state: z.string().min(1), properties: z.record(z.string(), z.unknown()), slots: reactNodeSchema, className: z.string().optional(), style: z.record(z.string(), z.unknown()).optional(), store: storeSchema,
});
export const slotPropsSchema = z.object({
  id: z.string().min(1), address: z.string().min(1), occupantId: z.string().min(1), occupantKind: z.enum(['primitive', 'composite']), occupants: z.record(z.string(), reactNodeSchema), properties: z.record(z.string(), z.unknown()), store: storeSchema,
});
