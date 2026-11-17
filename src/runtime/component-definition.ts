import { z } from 'zod';

export const frnlVisualDefinitionSchema = z.object({
  parameters: z.record(z.string(), z.unknown()),
});

export const frnlPhaseDefinitionSchema = z.object({
  visualDefinition: frnlVisualDefinitionSchema,
});

export const frnlEventDefinitionSchema = z.object({
  functionId: z.string().min(1),
});

export const frnlStateDefinitionSchema = z.object({
  name: z.string().min(1),
  events: z.record(z.string().min(1), frnlEventDefinitionSchema),
  visualParameters: z.record(z.string(), z.unknown()).default({}),
  phases: z.object({
    attackPhase: frnlPhaseDefinitionSchema.optional(),
    sustainPhase: frnlPhaseDefinitionSchema,
    releasePhase: frnlPhaseDefinitionSchema.optional(),
  }),
});

export const frnlComponentDefinitionSchema = z.object({
  name: z.string().min(1),
  presentation: z.object({
    role: z.string().min(1).optional(),
    label: z.string().min(1).optional(),
  }).optional(),
  states: z.record(z.string().min(1), frnlStateDefinitionSchema),
});

export type FrnlVisualDefinition = z.infer<typeof frnlVisualDefinitionSchema>;
export type FrnlPhaseDefinition = z.infer<typeof frnlPhaseDefinitionSchema>;
export type FrnlEventDefinition = z.infer<typeof frnlEventDefinitionSchema>;
export type FrnlStateDefinition = z.infer<typeof frnlStateDefinitionSchema>;
export type FrnlComponentDefinition = z.infer<typeof frnlComponentDefinitionSchema>;

export function defineFrnlComponent<T extends FrnlComponentDefinition>(definition: T): T {
  return frnlComponentDefinitionSchema.parse(definition) as T;
}
