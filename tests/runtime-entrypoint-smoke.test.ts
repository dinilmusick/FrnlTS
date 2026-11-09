import {describe, expect, it} from "vitest";

describe("FrnlTS headless runtime entrypoint", () => {
  it("imports the built headless runtime without browser globals", async () => {
    expect(typeof globalThis.window).toBe("undefined");
    expect(typeof globalThis.document).toBe("undefined");
    const runtime = await import("../dist/runtime/index.js");
    expect(runtime).toBeDefined();
  });
});
