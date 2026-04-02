import { describe, expect, it } from "vitest";

import { buildPlan, discoverSource } from "../../src/index.js";
import type { PlanSuggestionProvider } from "../../src/domain/providers/types.js";
import { initializeGitRepository } from "../helpers/git-repo.js";

describe("buildPlan with provider suggestions", () => {
  it("applies schema-valid provider suggestions through the normal plan validator", async () => {
    const { repoDir } = await initializeGitRepository({
      "AGENTS.md": [
        "# Agents",
        "",
        "[Notes](./docs/notes.md)",
        "[Guide](./docs/guide.md)",
      ].join("\n"),
      "docs/notes.md": "# Notes",
      "docs/guide.md": "# Guide for Acme",
    });

    const discovered = await discoverSource({
      repoLocator: repoDir,
    });
    const provider: PlanSuggestionProvider = {
      name: "mock-provider",
      suggestPlanAdjustments() {
        return Promise.resolve({
          fileSuggestions: [
            {
              path: "docs/notes.md",
              decision: "rolling_pointer",
              reason: "Provider marked notes as rolling.",
            },
          ],
          rewriteSuggestions: [
            {
              from: "AGENTS.md",
              to: "docs/notes.md",
              reason: "Rewrite to the pointer file.",
            },
          ],
          variables: [
            {
              name: "company_name",
              description: "Provider-suggested company variable",
              replacements: [{ path: "docs/guide.md", literal: "Acme" }],
            },
          ],
        });
      },
    };

    const plan = await buildPlan({
      ...discovered,
      provider,
    });

    expect(plan.files).toContainEqual({
      path: "docs/notes.md",
      decision: "rolling_pointer",
      reason: "Provider marked notes as rolling.",
      outputPath: "docs/_rolling/notes.md",
    });
    expect(plan.rewrites).toContainEqual({
      from: "AGENTS.md",
      to: "docs/notes.md",
      sourceOutputPath: "AGENTS.md",
      targetOutputPath: "docs/_rolling/notes.md",
      replacementHref: "docs/_rolling/notes.md",
      reason: "Rewrite to the pointer file.",
    });
    expect(plan.variables).toContainEqual({
      name: "company_name",
      description: "Provider-suggested company variable",
      replacements: [{ path: "docs/guide.md", literal: "Acme" }],
    });
  });

  it("falls back to the deterministic plan when the provider is unavailable", async () => {
    const { repoDir } = await initializeGitRepository({
      "AGENTS.md": ["# Agents", "", "[Notes](./docs/notes.md)"].join("\n"),
      "docs/notes.md": "# Notes",
    });

    const discovered = await discoverSource({
      repoLocator: repoDir,
    });

    const plan = await buildPlan({
      ...discovered,
      provider: {
        name: "mock-provider",
        suggestPlanAdjustments() {
          return Promise.reject(new Error("provider unavailable"));
        },
      },
    });

    expect(plan.files).toContainEqual({
      path: "docs/notes.md",
      decision: "keep",
      outputPath: "docs/notes.md",
    });
    expect(plan.variables).toEqual([]);
    expect(plan.rewrites).toEqual([]);
  });

  it("falls back to the deterministic plan when the provider response fails validation", async () => {
    const { repoDir } = await initializeGitRepository({
      "AGENTS.md": ["# Agents", "", "[Notes](./docs/notes.md)"].join("\n"),
      "docs/notes.md": "# Notes",
    });

    const discovered = await discoverSource({
      repoLocator: repoDir,
    });

    const plan = await buildPlan({
      ...discovered,
      provider: {
        name: "mock-provider",
        suggestPlanAdjustments() {
          return Promise.resolve({
            fileSuggestions: [
              {
                path: "docs/missing.md",
                decision: "drop",
              },
            ],
          });
        },
      },
    });

    expect(plan.files).toContainEqual({
      path: "docs/notes.md",
      decision: "keep",
      outputPath: "docs/notes.md",
    });
  });
});
