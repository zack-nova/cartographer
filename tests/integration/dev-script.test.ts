import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";

import {
  createTempDirectory,
  initializeGitRepository,
} from "../helpers/git-repo.js";

const execFileAsync = promisify(execFile);

describe("development script entrypoint", () => {
  it("prints the available dev commands when invoked without arguments", async () => {
    const result = await execFileAsync(
      process.execPath,
      ["--import", "tsx", "./scripts/dev.ts"],
      {
        cwd: process.cwd(),
      },
    );

    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Cartographer development commands");
    expect(result.stdout).toContain("discover");
    expect(result.stdout).toContain("build-plan");
    expect(result.stdout).toContain("materialize");
    expect(result.stdout).toContain("bootstrap");
  });

  it("runs the discover command with --json", async () => {
    const { repoDir } = await initializeGitRepository({
      "AGENTS.md": ["# Agents", "", "[Guide](./docs/guide.md)"].join("\n"),
      "docs/guide.md": "# Guide",
    });

    const result = await execFileAsync(
      process.execPath,
      [
        "--import",
        "tsx",
        "./scripts/dev.ts",
        "discover",
        "--repo",
        repoDir,
        "--json",
      ],
      {
        cwd: process.cwd(),
      },
    );

    expect(result.stderr).toBe("");

    const payload = JSON.parse(result.stdout) as {
      source: { rootDir: string };
      discovery: { discoveredPaths: string[] };
    };

    expect(payload.source.rootDir).toBe(repoDir);
    expect(payload.discovery.discoveredPaths).toEqual([
      "AGENTS.md",
      "docs/guide.md",
    ]);
  });

  it("runs the bootstrap command end-to-end with --json", async () => {
    const { repoDir } = await initializeGitRepository({
      "AGENTS.md": ["# Acme Agents", "", "[Guide](./docs/guide.md)"].join("\n"),
      "docs/guide.md": "# Guide for Acme",
    });
    const outputDir = await createTempDirectory("cartographer-dev-command-");

    const result = await execFileAsync(
      process.execPath,
      [
        "--import",
        "tsx",
        "./scripts/dev.ts",
        "bootstrap",
        "--repo",
        repoDir,
        "--output",
        outputDir,
        "--auto-approve",
        "--created-at",
        "2026-04-02T00:00:00.000Z",
        "--json",
      ],
      {
        cwd: process.cwd(),
      },
    );

    expect(result.stderr).toBe("");

    const payload = JSON.parse(result.stdout) as {
      sourceType: string;
      plan: { status: string };
      materialized?: { writtenPaths: string[] };
    };

    expect(payload.sourceType).toBe("plain_branch");
    expect(payload.plan.status).toBe("approved");
    expect(payload.materialized?.writtenPaths).toContain(
      ".harness/template.yaml",
    );
  });
});
