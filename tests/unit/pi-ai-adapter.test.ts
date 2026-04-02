import { describe, expect, it } from "vitest";

import { createPiAiPlanSuggestionProvider } from "../../src/domain/providers/pi-ai-adapter.js";

describe("createPiAiPlanSuggestionProvider", () => {
  it("assembles a stable structured prompt for the injected pi-ai client", async () => {
    const calls: Array<Record<string, string>> = [];
    const provider = createPiAiPlanSuggestionProvider({
      model: "pi-model",
      client: {
        generateObject(input) {
          calls.push(input);
          return Promise.resolve({});
        },
      },
    });

    await provider.suggestPlanAdjustments({
      source: {
        repoLocator: "/repo",
        requestedRef: null,
        resolvedRef: "main",
        commit: "1234567890abcdef1234567890abcdef12345678",
        rootDir: "/repo",
      },
      discovery: {
        seedPaths: ["AGENTS.md"],
        discoveredPaths: ["AGENTS.md"],
        edges: [],
      },
      deterministicPlan: {
        version: 1,
        source: {
          repoLocator: "/repo",
          requestedRef: null,
          resolvedRef: "main",
          commit: "1234567890abcdef1234567890abcdef12345678",
          rootDir: "/repo",
        },
        discoveredPaths: ["AGENTS.md"],
        harnessId: "repo_template",
        orbitId: "workspace",
        status: "draft",
        files: [
          { path: "AGENTS.md", decision: "keep", outputPath: "AGENTS.md" },
        ],
        rewrites: [],
        variables: [],
      },
      markdownFiles: [{ path: "AGENTS.md", content: "# Agents" }],
    });

    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      model: "pi-model",
      schemaName: "cartographer_provider_plan_suggestions_v1",
    });
    expect(calls[0].systemPrompt).toContain("structured curation suggestions");
    expect(calls[0].userPrompt).toContain('"discoveredPaths": [');
    expect(calls[0].userPrompt).toContain('"AGENTS.md"');
  });
});
