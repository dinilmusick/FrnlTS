import {
  EttinReranker17M,
  MiniLM,
  Needle3,
} from "@dinilmusick/gutts";
import {createContext, useContext} from "react";
import {z} from "zod";

export type SemanticInputSchema = {
  type: string;
  properties?: Record<string, SemanticInputSchema>;
  required?: readonly string[];
  enum?: readonly unknown[];
  items?: SemanticInputSchema;
  description?: string;
  [key: string]: unknown;
};

export type SemanticInputContext = {
  page?: string;
  section?: string;
  field?: string;
  label?: string;
  description?: string;
  semanticType?: string;
  vocabulary?: readonly string[];
  examples?: readonly string[];
  constraints?: readonly string[];
};

export type SemanticInputCandidate = {
  value: string;
  similarity?: number;
  relevance?: number;
};

export type SemanticInputResolution<T = unknown> = {
  status: "resolved" | "ambiguous" | "invalid";
  value?: T;
  rawInput?: string;
  candidates: readonly SemanticInputCandidate[];
  modelOutput: unknown;
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

async function rankCandidates(input: string, candidates: readonly string[]) {
  const similarity = new MiniLM();
  const reranker = new EttinReranker17M();
  const similarities = await Promise.all(candidates.map((candidate) => similarity.similarity({left: input, right: candidate})));
  const relevance = await reranker.rerank({query: input, candidates});
  return candidates.map((value, index) => ({value, similarity: similarities[index], relevance: relevance[index]}))
    .sort((a, b) => (b.relevance ?? -Infinity) - (a.relevance ?? -Infinity));
}

function unwrap(output: unknown): unknown {
  if (!output || typeof output !== "object") return output;
  const value = output as Record<string, unknown>;
  return value.output ?? value.result ?? value.data ?? value.structuredOutput ?? output;
}

export type FrnlResolvedInput<T> = SemanticInputResolution<T> & {
  validation?: z.SafeParseReturnType<unknown, T>;
};

export async function resolveFrnlInput<T>(
  contract: FrnlInputContract<T>,
  input: string,
): Promise<FrnlResolvedInput<T>> {
  const context = {
    ...contract.context,
    field: contract.name,
    label: contract.label,
    description: contract.description,
    semanticType: contract.semanticType,
    vocabulary: contract.vocabulary,
    examples: contract.examples,
  };
  const needle = new Needle3();
  const modelOutput = await needle.complete({
    prompt: [
      "Convert the natural-language input into the target schema.",
      "Use only information supported by the input and context.",
      JSON.stringify(context),
      JSON.stringify(input),
    ].join("\\n"),
    schema: contract.schema,
  });
  const candidates = contract.vocabulary?.length
    ? await rankCandidates(input, contract.vocabulary)
    : [];
  const value = unwrap(modelOutput);
  const resolution: SemanticInputResolution<T> = {
    status: value === undefined || value === null ? "invalid" : "resolved",
    value: value as T,
    candidates,
    modelOutput,
    ...(contract.preserveRawInput ? {rawInput: input} : {}),
  };

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
