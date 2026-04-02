import path from "node:path";

import { describe, expect, it } from "vitest";

import { discoverSource } from "../../src/index.js";
import {
  initializeGitRepository,
  runGit,
  writeRepoFiles,
} from "../helpers/git-repo.js";

describe("discoverSource", () => {
  it("discovers seed files, recursive markdown links, and stable graph ordering", async () => {
    const { repoDir } = await initializeGitRepository({
      "AGENTS.md": [
        "# Agents",
        "",
        "[Overview](./docs/overview.md)",
        "[Claude](./CLAUDE.md)",
        "[External](https://example.com/spec)",
        "[Anchor](#local-anchor)",
      ].join("\n"),
      "CLAUDE.md": ["# Claude", "", "[Deep Spec](./docs/deep/spec.md)"].join(
        "\n",
      ),
      "docs/overview.md": [
        "# Overview",
        "",
        "[Spec](./deep/spec.md)",
        "[Diagram](../assets/diagram.png)",
        "[Outside](../../outside.md)",
      ].join("\n"),
      "docs/deep/spec.md": ["# Spec", "", "[Overview](../overview.md)"].join(
        "\n",
      ),
      "assets/diagram.png": "binary-placeholder",
      "docs/ignored.md": "# Ignored",
    });

    const result = await discoverSource({
      repoLocator: repoDir,
    });

    expect(result.source.repoLocator).toBe(repoDir);
    expect(result.source.requestedRef).toBeNull();
    expect(result.source.resolvedRef).toBe("main");
    expect(result.source.rootDir).toBe(repoDir);
    expect(result.discovery.seedPaths).toEqual(["AGENTS.md", "CLAUDE.md"]);
    expect(result.discovery.discoveredPaths).toEqual([
      "AGENTS.md",
      "CLAUDE.md",
      "assets/diagram.png",
      "docs/deep/spec.md",
      "docs/overview.md",
    ]);
    expect(result.discovery.edges).toEqual([
      { from: "AGENTS.md", to: "CLAUDE.md", kind: "markdown_link" },
      { from: "AGENTS.md", to: "docs/overview.md", kind: "markdown_link" },
      { from: "CLAUDE.md", to: "docs/deep/spec.md", kind: "markdown_link" },
      {
        from: "docs/deep/spec.md",
        to: "docs/overview.md",
        kind: "markdown_link",
      },
      {
        from: "docs/overview.md",
        to: "assets/diagram.png",
        kind: "markdown_link",
      },
      {
        from: "docs/overview.md",
        to: "docs/deep/spec.md",
        kind: "markdown_link",
      },
    ]);
    expect(result.source.commit).toMatch(/^[0-9a-f]{40}$/);
  });

  it("resolves the repository root from a subdirectory and honors an explicit ref", async () => {
    const { repoDir, initialCommit } = await initializeGitRepository({
      "AGENTS.md": ["# Agents", "", "[V1](./docs/v1.md)"].join("\n"),
      "docs/v1.md": "# Version 1",
    });

    await writeRepoFiles(repoDir, {
      "AGENTS.md": ["# Agents", "", "[V2](./docs/v2.md)"].join("\n"),
      "docs/v2.md": "# Version 2",
    });
    await runGit(repoDir, ["add", "."]);
    await runGit(repoDir, ["commit", "-m", "second"]);

    const result = await discoverSource({
      repoLocator: path.join(repoDir, "docs"),
      ref: initialCommit,
    });

    expect(result.source.repoLocator).toBe(path.join(repoDir, "docs"));
    expect(result.source.requestedRef).toBe(initialCommit);
    expect(result.source.resolvedRef).toBe(initialCommit);
    expect(result.source.commit).toBe(initialCommit);
    expect(result.source.rootDir).toBe(repoDir);
    expect(result.discovery.seedPaths).toEqual(["AGENTS.md"]);
    expect(result.discovery.discoveredPaths).toEqual([
      "AGENTS.md",
      "docs/v1.md",
    ]);
    expect(result.discovery.edges).toEqual([
      { from: "AGENTS.md", to: "docs/v1.md", kind: "markdown_link" },
    ]);
  });

  it("fails when the source path is not inside a git repository", async () => {
    const result = discoverSource({
      repoLocator: await initializeNonGitDirectory(),
    });

    await expect(result).rejects.toThrow(
      "Source path is not inside a Git repository",
    );
  });
});

async function initializeNonGitDirectory(): Promise<string> {
  const { createTempDirectory } = await import("../helpers/git-repo.js");
  const directory = await createTempDirectory("cartographer-non-git-");

  await writeRepoFiles(directory, {
    "AGENTS.md": "# Not a repository",
  });

  return directory;
}
