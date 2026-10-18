import { z } from 'zod';

export const frnlElementKindSchema = z.enum(['primitive', 'composite']);

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
  phases: z.object({
    attackPhase: frnlPhaseDefinitionSchema,
    sustainPhase: frnlPhaseDefinitionSchema,
    releasePhase: frnlPhaseDefinitionSchema,
  }),
});

export const frnlElementDefinitionSchema = z.object({
  name: z.string().min(1),
  kind: frnlElementKindSchema,
  states: z.record(z.string().min(1), frnlStateDefinitionSchema),
});

export type FrnlElementKind = z.infer<typeof frnlElementKindSchema>;
export type FrnlVisualDefinition = z.infer<typeof frnlVisualDefinitionSchema>;
export type FrnlPhaseDefinition = z.infer<typeof frnlPhaseDefinitionSchema>;
export type FrnlEventDefinition = z.infer<typeof frnlEventDefinitionSchema>;
export type FrnlStateDefinition = z.infer<typeof frnlStateDefinitionSchema>;
export type FrnlElementDefinition = z.infer<typeof frnlElementDefinitionSchema>;

/**
 * Defines the semantic facade for an Element.
 *
 * Primitive and Composite are independent element kinds. The definition does
 * not encode either kind as a child of the other; composition is represented
 * by runtime relationships rather than filesystem or type coupling.
 */
export function defineFrnlElement<T extends FrnlElementDefinition>(definition: T): T {
  return frnlElementDefinitionSchema.parse(definition) as T;
}
