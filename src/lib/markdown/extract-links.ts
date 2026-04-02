import remarkParse from "remark-parse";
import { unified } from "unified";

type MarkdownNode = {
  type: string;
  url?: string;
  children?: MarkdownNode[];
};

const protocolPattern = /^[a-zA-Z][a-zA-Z\d+.-]*:/;

export function extractRelativeMarkdownLinks(markdown: string): string[] {
  const tree = unified().use(remarkParse).parse(markdown) as MarkdownNode;
  const links: string[] = [];

  visit(tree, (node) => {
    if (node.type !== "link" || typeof node.url !== "string") {
      return;
    }

    const normalizedHref = stripFragment(node.url);

    if (
      normalizedHref.length === 0 ||
      normalizedHref.startsWith("/") ||
      normalizedHref.startsWith("//") ||
      protocolPattern.test(normalizedHref)
    ) {
      return;
    }

    links.push(normalizedHref);
  });

  return links;
}

function stripFragment(href: string): string {
  const [pathPart] = href.split("#", 1);

  return pathPart ?? "";
}

function visit(
  node: MarkdownNode,
  visitor: (node: MarkdownNode) => void,
): void {
  visitor(node);

  for (const child of node.children ?? []) {
    visit(child, visitor);
  }
}
