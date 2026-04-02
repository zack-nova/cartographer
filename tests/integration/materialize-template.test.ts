import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildPlan,
  discoverSource,
  materializeTemplate,
} from "../../src/index.js";
import {
  createTempDirectory,
  initializeGitRepository,
} from "../helpers/git-repo.js";

describe("materializeTemplate", () => {
  it("writes an installable harness template tree from an approved plan", async () => {
    const { repoDir, initialCommit } = await initializeGitRepository({
      "AGENTS.md": [
        "# Acme Agents",
        "",
        '<!-- orbit:begin orbit_id="workspace" -->',
        "[Claude](./CLAUDE.md)",
        "[Guide](./docs/guide.md)",
        "[Changelog](./CHANGELOG.md)",
        '<!-- orbit:end orbit_id="workspace" -->',
        "",
        "Footer for Acme",
      ].join("\n"),
      "CLAUDE.md": ["# Claude for Acme", "", "[Guide](./docs/guide.md)"].join(
        "\n",
      ),
      "CHANGELOG.md": "# Changelog",
      "docs/guide.md": "# Guide for Acme",
      "docs/private.md": "# Private",
    });

    const discovered = await discoverSource({
      repoLocator: repoDir,
    });
    const draftPlan = await buildPlan({
      ...discovered,
      harnessId: "acme_template",
      excludePaths: ["docs/private.md"],
      variables: [
        {
          name: "company_name",
          description: "Brand placeholder",
          replacements: [
            { path: "AGENTS.md", literal: "Acme" },
            { path: "CLAUDE.md", literal: "Acme" },
            { path: "docs/guide.md", literal: "Acme" },
          ],
        },
      ],
    });
    const outputDir = await createTempDirectory("cartographer-output-");
    const result = await materializeTemplate({
      plan: {
        ...draftPlan,
        status: "approved",
      },
      outputDir,
      createdAt: "2026-04-02T00:00:00.000Z",
    });

    expect(result.outputDir).toBe(outputDir);
    expect(result.writtenPaths).toEqual([
      ".harness/template.yaml",
      ".orbit/orbits/workspace.yaml",
      "AGENTS.md",
      "docs/_adapters/claude-code-entry.md",
      "docs/_rolling/changelog.md",
      "docs/guide.md",
    ]);

    await expectFile(
      outputDir,
      "AGENTS.md",
      [
        "# $company_name Agents",
        "",
        "[Claude](docs/_adapters/claude-code-entry.md)",
        "[Guide](./docs/guide.md)",
        "[Changelog](docs/_rolling/changelog.md)",
        "",
        "Footer for $company_name",
      ].join("\n"),
    );
    await expectFile(
      outputDir,
      "docs/_adapters/claude-code-entry.md",
      ["# Claude for $company_name", "", "[Guide](../guide.md)"].join("\n"),
    );
    await expectFile(outputDir, "docs/guide.md", "# Guide for $company_name");
    await expectFile(
      outputDir,
      "docs/_rolling/changelog.md",
      [
        "# Rolling Content Pointer",
        "",
        "- source_path: CHANGELOG.md",
        "- reason: matched rolling heuristic",
        "",
        "This template intentionally excludes the rolling source content.",
      ].join("\n"),
    );
    await expectFile(
      outputDir,
      ".harness/template.yaml",
      [
        "schema_version: 1",
        "kind: harness_template",
        "template:",
        "  harness_id: acme_template",
        "  default_template: false",
        "  created_from_branch: main",
        `  created_from_commit: ${initialCommit}`,
        "  created_at: 2026-04-02T00:00:00.000Z",
        "  includes_root_agents: true",
        "members:",
        "  - orbit_id: workspace",
        "variables:",
        "  - name: company_name",
        "    description: Brand placeholder",
      ].join("\n"),
    );
    await expectFile(
      outputDir,
      ".orbit/orbits/workspace.yaml",
      [
        "schema_version: 1",
        "orbit:",
        "  id: workspace",
        "  description: Workspace template orbit",
        "  include:",
        "    - AGENTS.md",
        "    - docs/_adapters/claude-code-entry.md",
        "    - docs/_rolling/changelog.md",
        "    - docs/guide.md",
      ].join("\n"),
    );

    await expectMissing(outputDir, "CLAUDE.md");
    await expectMissing(outputDir, ".orbit/config.yaml");
    await expectMissing(outputDir, ".harness/runtime.yaml");
    await expectMissing(outputDir, ".harness/vars.yaml");
  });

  it("promotes a Claude-only root entry to the output root AGENTS.md", async () => {
    const { repoDir, initialCommit } = await initializeGitRepository({
      "CLAUDE.md": ["# Claude", "", "Only Claude root."].join("\n"),
      "docs/guide.md": "# Guide",
    });

    const discovered = await discoverSource({
      repoLocator: repoDir,
    });
    const draftPlan = await buildPlan({
      ...discovered,
      harnessId: "claude_only_template",
    });
    const outputDir = await createTempDirectory("cartographer-output-");

    const result = await materializeTemplate({
      plan: {
        ...draftPlan,
        status: "approved",
      },
      outputDir,
      createdAt: "2026-04-02T00:00:00.000Z",
    });

    expect(result.writtenPaths).toEqual([
      ".harness/template.yaml",
      ".orbit/orbits/workspace.yaml",
      "AGENTS.md",
    ]);
    await expectFile(
      outputDir,
      "AGENTS.md",
      ["# Claude", "", "Only Claude root."].join("\n"),
    );
    await expectFile(
      outputDir,
      ".harness/template.yaml",
      [
        "schema_version: 1",
        "kind: harness_template",
        "template:",
        "  harness_id: claude_only_template",
        "  default_template: false",
        "  created_from_branch: main",
        `  created_from_commit: ${initialCommit}`,
        "  created_at: 2026-04-02T00:00:00.000Z",
        "  includes_root_agents: false",
        "members:",
        "  - orbit_id: workspace",
        "variables:",
        "  []",
      ].join("\n"),
    );
    await expectMissing(outputDir, "CLAUDE.md");
  });

  it("rejects a draft plan", async () => {
    const { repoDir } = await initializeGitRepository({
      "AGENTS.md": "# Agents",
    });

    const discovered = await discoverSource({
      repoLocator: repoDir,
    });
    const draftPlan = await buildPlan({
      ...discovered,
    });
    const outputDir = await createTempDirectory("cartographer-output-");

    await expect(
      materializeTemplate({
        plan: draftPlan,
        outputDir,
        createdAt: "2026-04-02T00:00:00.000Z",
      }),
    ).rejects.toThrow("materializeTemplate requires an approved plan");
  });
});

async function expectFile(
  outputDir: string,
  relativePath: string,
  expectedContent: string,
): Promise<void> {
  const content = await readFile(path.join(outputDir, relativePath), "utf8");

  expect(content).toBe(expectedContent);
}

async function expectMissing(
  outputDir: string,
  relativePath: string,
): Promise<void> {
  await expect(
    readFile(path.join(outputDir, relativePath), "utf8"),
  ).rejects.toThrow();
}
