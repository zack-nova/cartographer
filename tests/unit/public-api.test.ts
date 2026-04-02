import { describe, expect, it } from "vitest";

describe("public library entrypoints", () => {
  it("exports the phase 0 library-first API surface", async () => {
    const api = await import("../../src/index.js");

    expect(api.discoverSource).toEqual(expect.any(Function));
    expect(api.buildPlan).toEqual(expect.any(Function));
    expect(api.materializeTemplate).toEqual(expect.any(Function));
    expect(api.bootstrapRepository).toEqual(expect.any(Function));
  });
});
