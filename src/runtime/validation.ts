import { z } from 'zod';

export const entityKindSchema = z.enum(['primitive', 'composite']);
export const entityIdSchema = z.string().min(1);
export const stateNameSchema = z.string().min(1);
export const propertyKeySchema = z.string().min(1);
export const propertyValueSchema = z.unknown();
export const propertiesSchema = z.record(z.string(), z.unknown());

export const entityStateSchema = z.object({
  kind: entityKindSchema,
  state: stateNameSchema,
  properties: propertiesSchema,
});

export const slotStateSchema = z.object({
  id: entityIdSchema,
  address: z.string().min(1),
  occupantId: entityIdSchema.nullable(),
  occupantKind: entityKindSchema.nullable(),
  properties: propertiesSchema,
});

export const occupantSchema = z.object({
  id: entityIdSchema,
  kind: entityKindSchema,
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

export const frnlEventPayloadSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('entity.stateChanged'), payload: entityStateChangedPayloadSchema }),
  z.object({ type: z.literal('entity.propertyChanged'), payload: entityPropertyChangedPayloadSchema }),
  z.object({ type: z.literal('slot.propertyChanged'), payload: slotPropertyChangedPayloadSchema }),
  z.object({ type: z.literal('slot.occupantChanged'), payload: slotOccupantChangedPayloadSchema }),
]);

export type EntityKind = z.infer<typeof entityKindSchema>;
export type EntityState = z.infer<typeof entityStateSchema>;
export type SlotState = z.infer<typeof slotStateSchema>;
export type Occupant = z.infer<typeof occupantSchema>;
export type FrnlEventPayload = z.infer<typeof frnlEventPayloadSchema>;

export function parseFrnlInput<T extends z.ZodType>(schema: T, input: unknown): z.infer<T> {
  return schema.parse(input);
}

export function validateFrnlInput<T extends z.ZodType>(schema: T, input: unknown): input is z.infer<T> {
  return schema.safeParse(input).success;
}
