import { describe, expect, it } from "vitest";

const entrypointNames = [
  "buildPlan",
  "materializeTemplate",
  "bootstrapRepository",
] as const;

describe("public library entrypoints", () => {
  it("exports the phase 0 library-first API surface", async () => {
    const api = await import("../../src/index.js");

    expect(api.discoverSource).toEqual(expect.any(Function));

    for (const entrypointName of entrypointNames) {
      expect(api[entrypointName]).toEqual(expect.any(Function));
    }
  });

  it.each(entrypointNames)(
    "%s rejects with a stable not-implemented placeholder error",
    async (entrypointName) => {
      const api = await import("../../src/index.js");

      await expect(api[entrypointName]()).rejects.toThrow(
        `${entrypointName} is not implemented yet`,
      );
    },
  );
});
