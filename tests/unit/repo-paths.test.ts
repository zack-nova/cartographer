import { describe, expect, it } from "vitest";

import { resolveRepoRelativeLinkTarget } from "../../src/lib/paths/repo-paths.js";

describe("resolveRepoRelativeLinkTarget", () => {
  it("resolves a relative link from the source document path", () => {
    expect(
      resolveRepoRelativeLinkTarget({
        fromPath: "docs/guides/getting-started.md",
        href: "../shared/overview.md",
      }),
    ).toBe("docs/shared/overview.md");
  });

  it("rejects a path that escapes the repository root", () => {
    expect(
      resolveRepoRelativeLinkTarget({
        fromPath: "AGENTS.md",
        href: "../outside.md",
      }),
    ).toBeNull();
  });
});
