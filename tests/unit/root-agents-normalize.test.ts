import { describe, expect, it } from "vitest";

import { normalizeRootAgentsContent } from "../../src/domain/materialize/normalize-root-agents.js";

describe("normalizeRootAgentsContent", () => {
  it("passes through a plain file unchanged", () => {
    const content = ["# Agents", "", "Use the guide."].join("\n");

    expect(normalizeRootAgentsContent(content)).toBe(content);
  });

  it("strips valid runtime orbit markers and keeps ordered payload", () => {
    const content = [
      "# Agents",
      "",
      '<!-- orbit:begin orbit_id="workspace" -->',
      "Use the guide.",
      '<!-- orbit:end orbit_id="workspace" -->',
      "",
      "Footer",
    ].join("\n");

    expect(normalizeRootAgentsContent(content)).toBe(
      ["# Agents", "", "Use the guide.", "", "Footer"].join("\n"),
    );
  });

  it("fails closed on malformed marker structure", () => {
    const content = [
      "# Agents",
      "",
      '<!-- orbit:begin orbit_id="workspace" -->',
      "Use the guide.",
    ].join("\n");

    expect(() => normalizeRootAgentsContent(content)).toThrow(
      "Invalid runtime AGENTS.md marker structure",
    );
  });
});
