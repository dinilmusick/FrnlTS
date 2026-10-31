import {
  resolveSemanticInput,
  type SemanticInputContext,
  type SemanticInputSchema,
  type SemanticInputResolution,
} from "@dinilmusick/gutts";
import {createContext, useContext} from "react";
import {z} from "zod";

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

export async function resolveFrnlInput<T>(
  contract: FrnlInputContract<T>,
  input: string,
): Promise<FrnlResolvedInput<T>> {
  const resolution = await resolveSemanticInput<T>({
    input,
    schema: contract.schema,
    context: {
      ...contract.context,
      field: contract.name,
      label: contract.label,
      description: contract.description,
      semanticType: contract.semanticType,
      vocabulary: contract.vocabulary,
      examples: contract.examples,
    },
    candidates: contract.vocabulary,
    preserveRawInput: contract.preserveRawInput ?? false,
  });

  if (resolution.status !== "resolved") return resolution;

  const validation = contract.validator.safeParse(resolution.value);
  if (!validation.success) {
    return {...resolution, status: "invalid", validation};
  }

  return {...resolution, value: validation.data, validation};
}

export function createFrnlInputContract<T>(
  contract: FrnlInputContract<T>,
): FrnlInputContract<T> {
  return Object.freeze({
    ...contract,
    transports: Object.freeze(contract.transports ?? ["text"]),
    preserveRawInput: contract.preserveRawInput ?? false,
  });
}

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
