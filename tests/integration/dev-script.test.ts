import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);

describe("development script entrypoint", () => {
  it("prints the available phase 0 entrypoints", async () => {
    const result = await execFileAsync(
      process.execPath,
      ["--import", "tsx", "./scripts/dev.ts"],
      {
        cwd: process.cwd(),
      },
    );

    expect(result.stderr).toBe("");
    expect(result.stdout).toContain(
      "Cartographer Phase 0 development entrypoint",
    );
    expect(result.stdout).toContain("discoverSource");
    expect(result.stdout).toContain("buildPlan");
    expect(result.stdout).toContain("materializeTemplate");
    expect(result.stdout).toContain("bootstrapRepository");
  });
});
