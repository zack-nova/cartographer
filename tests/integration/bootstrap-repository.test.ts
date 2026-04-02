import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { bootstrapRepository } from "../../src/index.js";
import {
  createTempDirectory,
  initializeGitRepository,
} from "../helpers/git-repo.js";

describe("bootstrapRepository", () => {
  it("returns a draft plan without materializing when autoApprove is not enabled", async () => {
    const { repoDir } = await initializeGitRepository({
      "AGENTS.md": ["# Agents", "", "[Guide](./docs/guide.md)"].join("\n"),
      "docs/guide.md": "# Guide",
    });

    const outputDir = await createTempDirectory("cartographer-output-");
    const result = await bootstrapRepository({
      repoLocator: repoDir,
      outputDir,
    });

    expect(result.sourceType).toBe("plain_branch");
    expect(result.plan.status).toBe("draft");
    expect(result.materialized).toBeUndefined();
    await expect(
      readFile(path.join(outputDir, "AGENTS.md"), "utf8"),
    ).rejects.toThrow();
  });

  it("runs the full end-to-end workflow when autoApprove is enabled", async () => {
    const { repoDir } = await initializeGitRepository({
      "AGENTS.md": [
        "# Acme Agents",
        "",
        "[Guide](./docs/guide.md)",
        "[Notes](./docs/notes.md)",
      ].join("\n"),
      "docs/guide.md": "# Guide for Acme",
      "docs/notes.md": "# Notes",
    });

    const outputDir = await createTempDirectory("cartographer-output-");
    const result = await bootstrapRepository({
      repoLocator: repoDir,
      outputDir,
      autoApprove: true,
      createdAt: "2026-04-02T00:00:00.000Z",
      variables: [
        {
          name: "company_name",
          replacements: [
            { path: "AGENTS.md", literal: "Acme" },
            { path: "docs/guide.md", literal: "Acme" },
          ],
        },
      ],
    });

    expect(result.sourceType).toBe("plain_branch");
    expect(result.plan.status).toBe("approved");
    expect(result.materialized?.writtenPaths).toEqual([
      ".harness/template.yaml",
      ".orbit/orbits/workspace.yaml",
      "AGENTS.md",
      "docs/guide.md",
      "docs/notes.md",
    ]);
    await expect(
      readFile(path.join(outputDir, ".harness/template.yaml"), "utf8"),
    ).resolves.toContain("kind: harness_template");
    await expect(
      readFile(path.join(outputDir, "AGENTS.md"), "utf8"),
    ).resolves.toContain("# $company_name Agents");
  });

  it("rejects an existing harness template branch", async () => {
    const { repoDir } = await initializeGitRepository({
      ".harness/template.yaml": "schema_version: 1\nkind: harness_template\n",
      "AGENTS.md": "# Template",
    });

    await expect(
      bootstrapRepository({
        repoLocator: repoDir,
      }),
    ).rejects.toThrow("Source branch is already a harness template branch");
  });

  it("rejects an existing orbit template branch", async () => {
    const { repoDir } = await initializeGitRepository({
      ".orbit/template.yaml": "schema_version: 1\nkind: orbit_template\n",
      "AGENTS.md": "# Template",
    });

    await expect(
      bootstrapRepository({
        repoLocator: repoDir,
      }),
    ).rejects.toThrow("Source branch is already an orbit template branch");
  });
});
