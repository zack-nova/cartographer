import type {
  DiscoveryEdge,
  DiscoveryGraph,
  SourceSnapshot,
} from "../source/types.js";
import {
  fileExistsAtRef,
  readTextFileAtRef,
} from "../../lib/git/repository.js";
import { extractRelativeMarkdownLinks } from "../../lib/markdown/extract-links.js";
import { resolveRepoRelativeLinkTarget } from "../../lib/paths/repo-paths.js";

const seedCandidates = ["AGENTS.md", "CLAUDE.md"] as const;

export async function discoverGraph(
  snapshot: SourceSnapshot,
): Promise<DiscoveryGraph> {
  const seedPaths = await resolveSeedPaths(snapshot);
  const discoveredPaths = new Set(seedPaths);
  const visitedMarkdownPaths = new Set<string>();
  const queue = [...seedPaths];
  const edgeKeys = new Set<string>();
  const edges: DiscoveryEdge[] = [];
  const fileExistsCache = new Map<string, boolean>();
  const fileContentCache = new Map<string, string>();

  while (queue.length > 0) {
    const currentPath = queue.shift();

    if (currentPath === undefined || !isMarkdownPath(currentPath)) {
      continue;
    }

    if (visitedMarkdownPaths.has(currentPath)) {
      continue;
    }

    visitedMarkdownPaths.add(currentPath);

    const markdown = await getFileContent(
      snapshot,
      currentPath,
      fileContentCache,
    );

    for (const href of extractRelativeMarkdownLinks(markdown)) {
      const targetPath = resolveRepoRelativeLinkTarget({
        fromPath: currentPath,
        href,
      });

      if (targetPath === null) {
        continue;
      }

      const exists = await getFileExists(snapshot, targetPath, fileExistsCache);

      if (!exists) {
        continue;
      }

      discoveredPaths.add(targetPath);
      pushEdge(edges, edgeKeys, currentPath, targetPath);

      if (isMarkdownPath(targetPath) && !visitedMarkdownPaths.has(targetPath)) {
        queue.push(targetPath);
      }
    }
  }

  return {
    seedPaths,
    discoveredPaths: [...discoveredPaths].sort(),
    edges: edges.sort(compareEdges),
  };
}

async function resolveSeedPaths(snapshot: SourceSnapshot): Promise<string[]> {
  const seedPaths: string[] = [];

  for (const seedPath of seedCandidates) {
    if (await fileExistsAtRef(snapshot.rootDir, snapshot.commit, seedPath)) {
      seedPaths.push(seedPath);
    }
  }

  return seedPaths;
}

async function getFileExists(
  snapshot: SourceSnapshot,
  filePath: string,
  cache: Map<string, boolean>,
): Promise<boolean> {
  const cached = cache.get(filePath);

  if (cached !== undefined) {
    return cached;
  }

  const exists = await fileExistsAtRef(
    snapshot.rootDir,
    snapshot.commit,
    filePath,
  );

  cache.set(filePath, exists);

  return exists;
}

async function getFileContent(
  snapshot: SourceSnapshot,
  filePath: string,
  cache: Map<string, string>,
): Promise<string> {
  const cached = cache.get(filePath);

  if (cached !== undefined) {
    return cached;
  }

  const content = await readTextFileAtRef(
    snapshot.rootDir,
    snapshot.commit,
    filePath,
  );

  cache.set(filePath, content);

  return content;
}

function isMarkdownPath(filePath: string): boolean {
  return filePath.endsWith(".md");
}

function pushEdge(
  edges: DiscoveryEdge[],
  edgeKeys: Set<string>,
  from: string,
  to: string,
): void {
  const key = `${from}->${to}`;

  if (edgeKeys.has(key)) {
    return;
  }

  edgeKeys.add(key);
  edges.push({
    from,
    to,
    kind: "markdown_link",
  });
}

function compareEdges(left: DiscoveryEdge, right: DiscoveryEdge): number {
  const fromComparison = left.from.localeCompare(right.from);

  if (fromComparison !== 0) {
    return fromComparison;
  }

  return left.to.localeCompare(right.to);
}
