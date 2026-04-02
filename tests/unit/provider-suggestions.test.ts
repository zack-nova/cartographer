import { describe, expect, it } from "vitest";

import { normalizeProviderPlanSuggestions } from "../../src/domain/providers/normalize-provider-plan-suggestions.js";

describe("normalizeProviderPlanSuggestions", () => {
  const discoveredPaths = ["AGENTS.md", "docs/status.md", "docs/guide.md"];
  const edges = [
    {
      from: "AGENTS.md",
      to: "docs/status.md",
      kind: "markdown_link" as const,
    },
  ];

  it("accepts a schema-valid provider response", () => {
    expect(
      normalizeProviderPlanSuggestions(
        {
          fileSuggestions: [
            {
              path: "docs/status.md",
              decision: "rolling_pointer",
              reason: "Provider marked this as rolling.",
            },
          ],
          rewriteSuggestions: [
            {
              from: "AGENTS.md",
              to: "docs/status.md",
              reason: "Prefer pointer link.",
            },
          ],
          variables: [
            {
              name: "company_name",
              description: "Brand placeholder",
              replacements: [{ path: "docs/guide.md", literal: "Acme" }],
            },
          ],
        },
        {
          discoveredPaths,
          edges,
        },
      ),
    ).toEqual({
      fileSuggestions: [
        {
          path: "docs/status.md",
          decision: "rolling_pointer",
          reason: "Provider marked this as rolling.",
        },
      ],
      rewriteSuggestions: [
        {
          from: "AGENTS.md",
          to: "docs/status.md",
          reason: "Prefer pointer link.",
        },
      ],
      variables: [
        {
          name: "company_name",
          description: "Brand placeholder",
          replacements: [{ path: "docs/guide.md", literal: "Acme" }],
        },
      ],
    });
  });

  it("rejects a suggestion that references a file outside the discovery set", () => {
    expect(() =>
      normalizeProviderPlanSuggestions(
        {
          fileSuggestions: [
            {
              path: "docs/missing.md",
              decision: "drop",
            },
          ],
        },
        {
          discoveredPaths,
          edges,
        },
      ),
    ).toThrow(
      "Provider suggestion references a path outside the discovery set: docs/missing.md",
    );
  });

  it("rejects a rewrite suggestion that is not part of the discovery graph", () => {
    expect(() =>
      normalizeProviderPlanSuggestions(
        {
          rewriteSuggestions: [
            {
              from: "docs/guide.md",
              to: "docs/status.md",
              reason: "Rewrite this link.",
            },
          ],
        },
        {
          discoveredPaths,
          edges,
        },
      ),
    ).toThrow(
      "Provider rewrite suggestion is not part of the discovery graph: docs/guide.md -> docs/status.md",
    );
  });
});
