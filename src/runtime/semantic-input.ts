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
