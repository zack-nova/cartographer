import { resolveRepoRelativeLinkTarget } from "../../lib/paths/repo-paths.js";
import type { LinkRewritePlan } from "../curation/types.js";

const markdownLinkPattern = /(\[[^\]]+\]\()([^)]+)(\))/g;

export function rewriteMarkdownContent(
  content: string,
  sourcePath: string,
  rewrites: LinkRewritePlan[],
): string {
  if (rewrites.length === 0) {
    return content;
  }

  return content.replace(
    markdownLinkPattern,
    (match, prefix: string, href: string, suffix: string) => {
      const targetPath = resolveRepoRelativeLinkTarget({
        fromPath: sourcePath,
        href,
      });

      if (targetPath === null) {
        return match;
      }

      const rewrite = rewrites.find(
        (candidate) =>
          candidate.from === sourcePath && candidate.to === targetPath,
      );

      if (rewrite === undefined) {
        return match;
      }

      return `${prefix}${rewrite.replacementHref}${suffix}`;
    },
  );
}
