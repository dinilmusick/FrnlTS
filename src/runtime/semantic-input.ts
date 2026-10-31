import {
  rankSemanticInputCandidates,
  resolveSemanticInput,
  type SemanticInputCandidate,
  type SemanticInputContext,
  type SemanticInputResolution,
  type SemanticInputSchema,
  type SemanticInputRisk,
} from "@dinilmusick/gutts";
import {createContext, type ReactNode, useContext} from "react";
import {z} from "zod";

export type {
  SemanticInputCandidate,
  SemanticInputContext,
  SemanticInputResolution,
  SemanticInputSchema,
  SemanticInputRisk,
};

export type FrnlInputTransport = "text" | "voice" | "paste" | "programmatic";

export type FrnlSemanticFieldState = {
  name: string;
  value?: unknown;
  semanticType?: string;
};

export type FrnlSemanticContext = {
  application?: string;
  workspace?: string;
  page?: string;
  section?: string;
  form?: string;
  locale?: string;
  fields?: readonly FrnlSemanticFieldState[];
};

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
  aliases?: readonly string[];
  constraints?: readonly string[];
  risk?: SemanticInputRisk;
  requireConfirmation?: boolean;
};

export type FrnlResolvedInput<T> = SemanticInputResolution<T> & {
  validation?: z.SafeParseReturnType<unknown, T>;
};

const FrnlSemanticContextValue = createContext<FrnlSemanticContext>({});

export function mergeFrnlSemanticContext(
  parent: FrnlSemanticContext,
  child?: FrnlSemanticContext,
): FrnlSemanticContext {
  if (!child) return parent;
  return {
    application: child.application ?? parent.application,
    workspace: child.workspace ?? parent.workspace,
    page: child.page ?? parent.page,
    section: child.section ?? parent.section,
    form: child.form ?? parent.form,
    locale: child.locale ?? parent.locale,
    fields: child.fields ?? parent.fields,
  };
}

export function FrnlSemanticContextProvider({
  value,
  children,
}: {
  value: FrnlSemanticContext;
  children?: ReactNode;
}) {
  const parent = useContext(FrnlSemanticContextValue);
  return (
    <FrnlSemanticContextValue.Provider value={mergeFrnlSemanticContext(parent, value)}>
      {children}
    </FrnlSemanticContextValue.Provider>
  );
}

export const FrnlSemanticInputProvider = FrnlSemanticContextProvider;

export function useFrnlSemanticInputContext(): FrnlSemanticContext {
  return useContext(FrnlSemanticContextValue);
}

function buildContext(
  contract: FrnlInputContract<unknown>,
  sharedContext?: FrnlSemanticContext,
): SemanticInputContext {
  return {
    ...contract.context,
    application: contract.context?.application ?? sharedContext?.application,
    workspace: contract.context?.workspace ?? sharedContext?.workspace,
    page: contract.context?.page ?? sharedContext?.page,
    section: contract.context?.section ?? sharedContext?.section,
    form: contract.context?.form ?? sharedContext?.form,
    locale: contract.context?.locale ?? sharedContext?.locale,
    field: contract.name,
    label: contract.label,
    description: contract.description,
    semanticType: contract.semanticType,
    vocabulary: contract.vocabulary,
    examples: contract.examples,
    aliases: contract.aliases,
    constraints: contract.constraints,
    relatedFields: sharedContext?.fields?.map((field) => field.name).filter((name) => name !== contract.name),
  };
}

export async function resolveFrnlInput<T>(
  contract: FrnlInputContract<T>,
  input: string,
  sharedContext?: FrnlSemanticContext,
): Promise<FrnlResolvedInput<T>> {
  const mergedContext = buildContext(contract, sharedContext);
  const rawResolution = await resolveSemanticInput<unknown>({
    input,
    schema: contract.schema,
    context: mergedContext,
    candidates: contract.vocabulary,
    preserveRawInput: contract.preserveRawInput ?? false,
    policy: {
      risk: contract.risk,
      requireConfirmation: contract.requireConfirmation,
    },
  });

  if (rawResolution.status !== "resolved" || rawResolution.value === undefined || rawResolution.value === null) {
    return {
      ...rawResolution,
      value: undefined,
    };
  }

  const validation = contract.validator.safeParse(rawResolution.value);
  if (!validation.success) {
    return {
      ...rawResolution,
      status: "invalid",
      value: undefined,
      validation,
      error: {
        code: "SCHEMA_MISMATCH",
        message: "Semantic output failed the field validator.",
      },
    };
  }

  return {
    ...rawResolution,
    status: "resolved",
    value: validation.data,
    validation,
  };
}

export type FrnlSemanticFormContract<T> = {
  fields: Readonly<Record<string, FrnlInputContract<unknown>>>;
  validator: z.ZodType<T>;
  schema?: SemanticInputSchema;
  context?: FrnlSemanticContext;
  preserveRawInput?: boolean;
};

export type FrnlResolvedForm<T> = {
  status: FrnlResolvedInput<T>["status"];
  value?: T;
  rawInput?: string;
  fields: Readonly<Record<string, FrnlResolvedInput<unknown>>>;
  modelOutput: unknown;
  candidates: readonly SemanticInputCandidate[];
  clarification?: FrnlResolvedInput<T>["clarification"];
  evidence?: FrnlResolvedInput<T>["evidence"];
  error?: FrnlResolvedInput<T>["error"];
};

export async function resolveFrnlFormInput<T>(
  contract: FrnlSemanticFormContract<T>,
  input: string,
): Promise<FrnlResolvedForm<T>> {
  const fieldEntries = Object.entries(contract.fields);
  const schema = contract.schema ?? {
    type: "object",
    properties: Object.fromEntries(fieldEntries.map(([name, field]) => [name, field.schema])),
    required: fieldEntries.filter(([, field]) => field.schema.required?.includes(name)).map(([name]) => name),
  };

  const raw = await resolveSemanticInput<unknown>({
    input,
    schema,
    context: {
      application: contract.context?.application,
      workspace: contract.context?.workspace,
      page: contract.context?.page,
      section: contract.context?.section,
      form: contract.context?.form,
      locale: contract.context?.locale,
      description: "Resolve natural-language input across the fields of this form.",
      relatedFields: fieldEntries.map(([name]) => name),
      constraints: fieldEntries.flatMap(([, field]) => field.constraints ?? []),
    },
    preserveRawInput: contract.preserveRawInput ?? false,
  });

  if (raw.status !== "resolved" || raw.value === undefined || raw.value === null || typeof raw.value !== "object") {
    return {
      status: raw.status,
      ...(raw.rawInput !== undefined ? {rawInput: raw.rawInput} : {}),
      fields: {},
      modelOutput: raw.modelOutput,
      candidates: raw.candidates,
      ...(raw.clarification ? {clarification: raw.clarification} : {}),
      ...(raw.evidence ? {evidence: raw.evidence} : {}),
      ...(raw.error ? {error: raw.error} : {}),
    };
  }

  const objectValue = raw.value as Record<string, unknown>;
  const resolvedFields: Record<string, FrnlResolvedInput<unknown>> = {};
  let valid = true;

  for (const [name, field] of fieldEntries) {
    const value = objectValue[name];
    const validation = field.validator.safeParse(value);
    resolvedFields[name] = validation.success
      ? {
          status: "resolved",
          value: validation.data,
          candidates: [],
          modelOutput: value,
          validation,
        }
      : {
          status: "invalid",
          value: undefined,
          candidates: [],
          modelOutput: value,
          validation,
          error: {code: "SCHEMA_MISMATCH", message: `Field '${name}' failed validation.`},
        };
    if (!validation.success) valid = false;
  }

  const formValidation = contract.validator.safeParse(objectValue);
  if (!formValidation.success || !valid) {
    return {
      status: "invalid",
      ...(raw.rawInput !== undefined ? {rawInput: raw.rawInput} : {}),
      fields: resolvedFields,
      modelOutput: raw.modelOutput,
      candidates: raw.candidates,
      evidence: raw.evidence,
      error: {code: "SCHEMA_MISMATCH", message: "Resolved form data failed validation."},
    };
  }

  return {
    status: "resolved",
    value: formValidation.data,
    ...(raw.rawInput !== undefined ? {rawInput: raw.rawInput} : {}),
    fields: resolvedFields,
    modelOutput: raw.modelOutput,
    candidates: raw.candidates,
    evidence: raw.evidence,
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
  const common = {
    name: input.name,
    label: input.label,
    description: input.description,
    context: input.context,
  };

  switch (inputType) {
    case "number":
    case "range":
      return createFrnlInputContract({...common, semanticType: "number", schema: {type: "number"}, validator: z.number().finite()});
    case "email":
      return createFrnlInputContract({...common, semanticType: "email", schema: {type: "string", format: "email"}, validator: z.string().email()});
    case "url":
      return createFrnlInputContract({...common, semanticType: "url", schema: {type: "string", format: "uri"}, validator: z.string().url()});
    case "date":
      return createFrnlInputContract({...common, semanticType: "date", schema: {type: "string", format: "date"}, validator: z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date")});
    case "datetime-local":
      return createFrnlInputContract({...common, semanticType: "datetime", schema: {type: "string", format: "date-time"}, validator: z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date-time")});
    case "month":
      return createFrnlInputContract({...common, semanticType: "month", schema: {type: "string", pattern: "^\\d{4}-\\d{2}$"}, validator: z.string().regex(/^\\d{4}-\\d{2}$/)});
    case "time":
      return createFrnlInputContract({...common, semanticType: "time", schema: {type: "string", pattern: "^\\d{2}:\\d{2}(:\\d{2})?$"}, validator: z.string().regex(/^\\d{2}:\\d{2}(:\\d{2})?$/)});
    case "text":
    case "search":
    case "tel":
      return createFrnlInputContract({...common, semanticType: inputType, schema: {type: "string"}, validator: z.string()});
    default:
      return undefined;
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
