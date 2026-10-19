import { z } from 'zod';

export const entityKindSchema = z.enum(['primitive', 'composite']);
export const entityIdSchema = z.string().min(1);
export const stateNameSchema = z.string().min(1);
export const propertyKeySchema = z.string().min(1);

/**
 * Property values are intentionally extensible to support arbitrary CSS, design tokens,
 * numeric scales, callbacks, or primitive payloads while the enclosing semantic structure
 * (entity ID, property key, and state model) is strictly validated.
 */
export const propertyValueSchema = z.unknown();
export const propertiesSchema = z.record(z.string(), propertyValueSchema);

/** Optional visual overrides registered under a theme's component and state names. */
export const frnlThemeStateSchema = z.object({
  visualParameters: propertiesSchema.optional(),
}).strict();

export const frnlThemeComponentSchema = z.object({
  states: z.record(z.string().min(1), frnlThemeStateSchema).optional(),
}).strict();

/** Themes are data-only maps: component name -> state name -> visual parameters. */
export const frnlThemeDefinitionSchema = z.record(
  z.string().min(1),
  frnlThemeComponentSchema,
);

export const boundsSchema = z.object({
  width: z.union([z.string(), z.number()]).optional(),
  height: z.union([z.string(), z.number()]).optional(),
}).optional();

export const visualAssetSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  properties: propertiesSchema.optional(),
  clipped: z.boolean().optional(),
});

export const entityStateSchema = z.object({
  kind: entityKindSchema,
  state: stateNameSchema,
  properties: propertiesSchema,
  bounds: boundsSchema.optional(),
  assets: z.array(visualAssetSchema).optional(),
});

export const occupantSchema = z.object({
  id: entityIdSchema,
  kind: entityKindSchema,
});

export const slotStateSchema = z.object({
  id: entityIdSchema,
  address: z.string().min(1),
  occupantId: entityIdSchema.nullable(),
  occupantKind: entityKindSchema.nullable(),
  properties: propertiesSchema,
});

export const slotCollectionSchema = z.object({
  id: entityIdSchema,
  address: z.string().min(1),
  slotIds: z.array(entityIdSchema),
});

export const entityStateChangedPayloadSchema = z.object({
  entityId: entityIdSchema,
  previousState: stateNameSchema,
  state: stateNameSchema,
});

export const entityPropertyChangedPayloadSchema = z.object({
  entityId: entityIdSchema,
  key: propertyKeySchema,
  value: propertyValueSchema,
});

export const slotPropertyChangedPayloadSchema = z.object({
  slotId: entityIdSchema,
  key: propertyKeySchema,
  value: propertyValueSchema,
});

export const slotOccupantChangedPayloadSchema = z.object({
  slotId: entityIdSchema,
  address: z.string().min(1),
  previousOccupant: occupantSchema.nullable(),
  occupant: occupantSchema.nullable(),
});

export const slotStateChangedPayloadSchema = z.object({
  slotId: entityIdSchema,
  address: z.string().min(1),
  occupantId: entityIdSchema,
  previousState: stateNameSchema,
  state: stateNameSchema,
});

export const slotCollectionChangedPayloadSchema = z.object({
  collectionId: entityIdSchema,
  address: z.string().min(1),
  slotIds: z.array(entityIdSchema),
  action: z.enum(['set', 'add', 'remove']),
});

export const flowTriggeredPayloadSchema = z.object({
  flowId: z.string().min(1),
  compositeId: entityIdSchema,
  trigger: z.string().min(1),
  payload: propertyValueSchema.optional(),
});

export const frnlEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('entity.stateChanged'), payload: entityStateChangedPayloadSchema }),
  z.object({ type: z.literal('entity.propertyChanged'), payload: entityPropertyChangedPayloadSchema }),
  z.object({ type: z.literal('slot.propertyChanged'), payload: slotPropertyChangedPayloadSchema }),
  z.object({ type: z.literal('slot.occupantChanged'), payload: slotOccupantChangedPayloadSchema }),
  z.object({ type: z.literal('slot.stateChanged'), payload: slotStateChangedPayloadSchema }),
  z.object({ type: z.literal('slot.collectionChanged'), payload: slotCollectionChangedPayloadSchema }),
  z.object({ type: z.literal('flow.triggered'), payload: flowTriggeredPayloadSchema }),
]);

export type EntityKind = z.infer<typeof entityKindSchema>;
export type EntityState = z.infer<typeof entityStateSchema>;
export type SlotState = z.infer<typeof slotStateSchema>;
export type SlotCollectionState = z.infer<typeof slotCollectionSchema>;
export type Occupant = z.infer<typeof occupantSchema>;
export type Bounds = z.infer<typeof boundsSchema>;
export type VisualAsset = z.infer<typeof visualAssetSchema>;
export type FrnlEventPayload = z.infer<typeof frnlEventSchema>;
export type FrnlEvent = z.infer<typeof frnlEventSchema>;

export function parseFrnlInput<T extends z.ZodType>(schema: T, input: unknown): z.infer<T> {
  return schema.parse(input);
}

export function validateFrnlInput<T extends z.ZodType>(schema: T, input: unknown): input is z.infer<T> {
  return schema.safeParse(input).success;
}
