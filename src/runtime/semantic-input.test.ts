import {describe, expect, it, vi} from "vitest";

vi.mock("@dinilmusick/gutts", () => ({
  resolveSemanticInput: vi.fn(async () => ({
    status: "resolved",
    value: 32,
    candidates: [],
    modelOutput: 32,
  })),
}));

import {resolveFrnlInput} from "./semantic-input.js";

describe("Frnl semantic input", () => {
  it("validates structured natural-language resolution with Zod", async () => {
    const result = await resolveFrnlInput({
      name: "age",
      label: "Age",
      schema: {type: "integer", minimum: 0, maximum: 120},
      validator: (await import("zod")).z.number().int().min(0).max(120),
    }, "I am thirty two");
    expect(result.status).toBe("resolved");
    expect(result.value).toBe(32);
    expect(result.validation?.success).toBe(true);
  });

  it("does not preserve raw input unless requested", async () => {
    const result = await resolveFrnlInput({
      name: "age",
      label: "Age",
      schema: {type: "integer"},
      validator: (await import("zod")).z.number().int(),
    }, "32");
    expect("rawInput" in result).toBe(false);
  });
});
