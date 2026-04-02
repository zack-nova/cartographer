import { describe, expect, it } from "vitest";

import { extractRelativeMarkdownLinks } from "../../src/lib/markdown/extract-links.js";

describe("extractRelativeMarkdownLinks", () => {
  it("keeps only explicit relative links and strips fragments", () => {
    const markdown = `
[guide](./docs/guide.md#intro)
[image](../assets/diagram.png)
[section](#local-anchor)
[site](https://example.com/spec)
[mail](mailto:test@example.com)
[root](/docs/root.md)
`;

    expect(extractRelativeMarkdownLinks(markdown)).toEqual([
      "./docs/guide.md",
      "../assets/diagram.png",
    ]);
  });
});
