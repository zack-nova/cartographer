import { describe, expect, it } from "vitest";

import { buildPlan, discoverSource } from "../../src/index.js";
import { initializeGitRepository } from "../helpers/git-repo.js";

describe("buildPlan", () => {
  it("emits a stable curation plan with keep, drop, rolling, and rewrite decisions", async () => {
    const { repoDir, initialCommit } = await initializeGitRepository({
      "AGENTS.md": [
        "# Acme Agents",
        "",
        "[Claude](./CLAUDE.md)",
        "[Guide](./docs/guide.md)",
        "[Changelog](./CHANGELOG.md)",
        "[Private](./docs/private.md)",
      ].join("\n"),
      "CLAUDE.md": ["# Claude", "", "[Guide](./docs/guide.md)"].join("\n"),
      "CHANGELOG.md": "# Changelog",
      "docs/guide.md": "# Guide",
      "docs/private.md": "# Private",
    });

    const discovered = await discoverSource({
      repoLocator: repoDir,
    });
    const plan = await buildPlan({
      ...discovered,
      harnessId: "acme_template",
      excludePaths: ["docs/private.md"],
      variables: [
        {
          name: "company_name",
          description: "Brand placeholder",
          replacements: [{ path: "AGENTS.md", literal: "Acme" }],
        },
      ],
    });

    expect(plan).toEqual({
      version: 1,
      source: {
        repoLocator: repoDir,
        requestedRef: null,
        resolvedRef: "main",
        commit: initialCommit,
        rootDir: repoDir,
      },
      discoveredPaths: [
        "AGENTS.md",
        "CHANGELOG.md",
        "CLAUDE.md",
        "docs/guide.md",
        "docs/private.md",
      ],
      harnessId: "acme_template",
      orbitId: "workspace",
      status: "draft",
      files: [
        {
          path: "AGENTS.md",
          decision: "keep",
          outputPath: "AGENTS.md",
        },
        {
          path: "CHANGELOG.md",
          decision: "rolling_pointer",
          reason: "matched rolling heuristic",
          outputPath: "docs/_rolling/changelog.md",
        },
        {
          path: "CLAUDE.md",
          decision: "keep",
          reason: "root Claude entry retained as adapter content",
          outputPath: "docs/_adapters/claude-code-entry.md",
        },
        {
          path: "docs/guide.md",
          decision: "keep",
          outputPath: "docs/guide.md",
        },
        {
          path: "docs/private.md",
          decision: "drop",
          reason: "excluded by explicit rule",
        },
      ],
      rewrites: [
        {
          from: "AGENTS.md",
          to: "CHANGELOG.md",
          sourceOutputPath: "AGENTS.md",
          targetOutputPath: "docs/_rolling/changelog.md",
          replacementHref: "docs/_rolling/changelog.md",
        },
        {
          from: "AGENTS.md",
          to: "CLAUDE.md",
          sourceOutputPath: "AGENTS.md",
          targetOutputPath: "docs/_adapters/claude-code-entry.md",
          replacementHref: "docs/_adapters/claude-code-entry.md",
        },
        {
          from: "CLAUDE.md",
          to: "docs/guide.md",
          sourceOutputPath: "docs/_adapters/claude-code-entry.md",
          targetOutputPath: "docs/guide.md",
          replacementHref: "../guide.md",
        },
      ],
      variables: [
        {
          name: "company_name",
          description: "Brand placeholder",
          replacements: [{ path: "AGENTS.md", literal: "Acme" }],
        },
      ],
    });
  });

  it("fails closed when the same literal maps to multiple variable names", async () => {
    const { repoDir } = await initializeGitRepository({
      "AGENTS.md": "# Agents",
    });

    const discovered = await discoverSource({
      repoLocator: repoDir,
    });

    await expect(
      buildPlan({
        ...discovered,
        variables: [
          {
            name: "company_name",
            replacements: [{ path: "AGENTS.md", literal: "Acme" }],
          },
          {
            name: "organization_name",
            replacements: [{ path: "AGENTS.md", literal: "Acme" }],
          },
        ],
      }),
    ).rejects.toThrow(
      "Variable literal conflict: Acme is mapped to both company_name and organization_name",
    );
  });

  it("fails closed when the Claude adapter reserved output path would conflict", async () => {
    const { repoDir } = await initializeGitRepository({
      "AGENTS.md": [
        "# Agents",
        "",
        "[Claude](./CLAUDE.md)",
        "[Reserved](./docs/_adapters/claude-code-entry.md)",
      ].join("\n"),
      "CLAUDE.md": "# Claude",
      "docs/_adapters/claude-code-entry.md": "# Reserved",
    });

    const discovered = await discoverSource({
      repoLocator: repoDir,
    });

    await expect(
      buildPlan({
        ...discovered,
      }),
    ).rejects.toThrow(
      "Planned output path conflict: docs/_adapters/claude-code-entry.md",
    );
  });
});
