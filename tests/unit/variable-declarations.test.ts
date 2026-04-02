import { describe, expect, it } from "vitest";

import { validateVariableDeclarations } from "../../src/domain/variables/validate-variable-declarations.js";

describe("validateVariableDeclarations", () => {
  const discoveredPaths = ["AGENTS.md", "docs/guide.md"];

  it("accepts stable variable declarations", () => {
    expect(
      validateVariableDeclarations(
        [
          {
            name: "company_name",
            description: "Reusable company label",
            replacements: [{ path: "AGENTS.md", literal: "Acme" }],
          },
        ],
        discoveredPaths,
      ),
    ).toEqual([
      {
        name: "company_name",
        description: "Reusable company label",
        replacements: [{ path: "AGENTS.md", literal: "Acme" }],
      },
    ]);
  });

  it("rejects invalid variable names", () => {
    expect(() =>
      validateVariableDeclarations(
        [
          {
            name: "CompanyName",
            replacements: [{ path: "AGENTS.md", literal: "Acme" }],
          },
        ],
        discoveredPaths,
      ),
    ).toThrow("Invalid variable name: CompanyName");
  });

  it("rejects empty replacement literals", () => {
    expect(() =>
      validateVariableDeclarations(
        [
          {
            name: "company_name",
            replacements: [{ path: "AGENTS.md", literal: "" }],
          },
        ],
        discoveredPaths,
      ),
    ).toThrow("Variable replacement literal cannot be empty");
  });
});
