import {
  rankSemanticInputCandidates,
  resolveSemanticInput,
  type SemanticInputCandidate,
  type SemanticInputContext,
  type SemanticInputResolution,
  type SemanticInputSchema,
} from "@dinilmusick/gutts";
import {createContext, useContext} from "react";
import {z} from "zod";

export type {
  SemanticInputCandidate,
  SemanticInputContext,
  SemanticInputResolution,
  SemanticInputSchema,
};

export type FrnlInputTransport = "text" | "voice" | "paste" | "programmatic";

export type FrnlInputContract<T> = {
  name: string;
  label: string;
  description?: string;
  semanticType?: string;
  schema: SemanticInputSchema;
  validator: z.ZodType<T>;
  context?: SemanticInputContext;
  transports?: readonly FrnlInputTransport[];
  preserveRawInput?: boolean;
  vocabulary?: readonly string[];
  examples?: readonly string[];
};

export type FrnlResolvedInput<T> = SemanticInputResolution<T> & {
  validation?: z.SafeParseReturnType<unknown, T>;
};

export type FrnlSemanticContext = {
  page?: string;
  section?: string;
  application?: string;
  workspace?: string;
};

const FrnlSemanticContextValue = createContext<FrnlSemanticContext>({});

export const FrnlSemanticInputProvider = FrnlSemanticContextValue.Provider;

export function useFrnlSemanticInputContext(): FrnlSemanticContext {
  return useContext(FrnlSemanticContextValue);
}

export async function resolveFrnlInput<T>(
  contract: FrnlInputContract<T>,
  input: string,
  sharedContext?: FrnlSemanticContext,
): Promise<FrnlResolvedInput<T>> {
  const mergedContext: SemanticInputContext = {
    ...contract.context,
    page: contract.context?.page ?? sharedContext?.page,
    section: contract.context?.section ?? sharedContext?.section,
    field: contract.name,
    label: contract.label,
    description: contract.description,
    semanticType: contract.semanticType,
    vocabulary: contract.vocabulary,
    examples: contract.examples,
  };

  const rawResolution = await resolveSemanticInput<unknown>({
    input,
    schema: contract.schema,
    context: mergedContext,
    candidates: contract.vocabulary,
    preserveRawInput: contract.preserveRawInput ?? false,
  });

  if (rawResolution.status !== "resolved" || rawResolution.value === undefined || rawResolution.value === null) {
    return {
      status: "invalid",
      value: undefined,
      candidates: rawResolution.candidates,
      modelOutput: rawResolution.modelOutput,
      ...(contract.preserveRawInput ? {rawInput: input} : {}),
    };
  }

  const validation = contract.validator.safeParse(rawResolution.value);
  if (!validation.success) {
    return {
      status: "invalid",
      value: undefined,
      candidates: rawResolution.candidates,
      modelOutput: rawResolution.modelOutput,
      validation,
      ...(contract.preserveRawInput ? {rawInput: input} : {}),
    };
  }

  return {
    status: "resolved",
    value: validation.data,
    candidates: rawResolution.candidates,
    modelOutput: rawResolution.modelOutput,
    validation,
    ...(contract.preserveRawInput ? {rawInput: input} : {}),
  };
}


export function createDefaultFrnlInputContract(
  input: {
    name: string;
    label: string;
    description?: string;
    inputType?: string;
    context?: FrnlSemanticContext;
  },
): FrnlInputContract<unknown> | undefined {
  const inputType = input.inputType ?? "text";

  switch (inputType) {
    case "number":
    case "range":
      return createFrnlInputContract({
        name: input.name,
        label: input.label,
        description: input.description,
        semanticType: "number",
        schema: {type: "number"},
        validator: z.number().finite(),
        context: input.context,
      });
    case "email":
      return createFrnlInputContract({
        name: input.name,
        label: input.label,
        description: input.description,
        semanticType: "email",
        schema: {type: "string", format: "email"},
        validator: z.string().email(),
        context: input.context,
      });
    case "url":
      return createFrnlInputContract({
        name: input.name,
        label: input.label,
        description: input.description,
        semanticType: "url",
        schema: {type: "string", format: "uri"},
        validator: z.string().url(),
        context: input.context,
      });
    case "date":
      return createFrnlInputContract({
        name: input.name,
        label: input.label,
        description: input.description,
        semanticType: "date",
        schema: {type: "string", format: "date"},
        validator: z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date"),
        context: input.context,
      });
    case "datetime-local":
      return createFrnlInputContract({
        name: input.name,
        label: input.label,
        description: input.description,
        semanticType: "datetime",
        schema: {type: "string", format: "date-time"},
        validator: z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date-time"),
        context: input.context,
      });
    case "month":
      return createFrnlInputContract({
        name: input.name,
        label: input.label,
        description: input.description,
        semanticType: "month",
        schema: {type: "string", pattern: "^\\d{4}-\\d{2}$"},
        validator: z.string().regex(/^\\d{4}-\\d{2}$/),
        context: input.context,
      });
    case "time":
      return createFrnlInputContract({
        name: input.name,
        label: input.label,
        description: input.description,
        semanticType: "time",
        schema: {type: "string", pattern: "^\\d{2}:\\d{2}(:\\d{2})?$"},
        validator: z.string().regex(/^\\d{2}:\\d{2}(:\\d{2})?$/),
        context: input.context,
      });
    case "text":
    case "search":
    case "tel":
    default:
      if (!["text", "search", "tel"].includes(inputType)) return undefined;
      return createFrnlInputContract({
        name: input.name,
        label: input.label,
        description: input.description,
        semanticType: inputType,
        schema: {type: "string"},
        validator: z.string(),
        context: input.context,
      });
  }
}

export function createFrnlInputContract<T>(
  contract: FrnlInputContract<T>,
): FrnlInputContract<T> {
  const transports: readonly FrnlInputTransport[] = contract.transports ?? (["text"] as const);
  return Object.freeze({
    ...contract,
    transports: Object.freeze([...transports]),
    preserveRawInput: contract.preserveRawInput ?? false,
  });
}
