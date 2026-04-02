import path from "node:path";

type ResolveRepoRelativeLinkTargetInput = {
  fromPath: string;
  href: string;
};

export function resolveRepoRelativeLinkTarget({
  fromPath,
  href,
}: ResolveRepoRelativeLinkTargetInput): string | null {
  const fromDir = path.posix.dirname(fromPath);
  const baseDir = fromDir === "." ? "" : fromDir;
  const resolvedPath = path.posix.normalize(path.posix.join(baseDir, href));

  return normalizeRepoRelativePath(resolvedPath);
}

export function normalizeRepoRelativePath(filePath: string): string | null {
  const normalizedPath = path.posix.normalize(filePath.replaceAll("\\", "/"));

  if (
    normalizedPath.length === 0 ||
    normalizedPath === "." ||
    normalizedPath === ".." ||
    normalizedPath.startsWith("../") ||
    path.posix.isAbsolute(normalizedPath)
  ) {
    return null;
  }

  return normalizedPath;
}

export function buildRelativeOutputLink(
  fromOutputPath: string,
  targetOutputPath: string,
): string {
  const fromDir = path.posix.dirname(fromOutputPath);
  const relativePath = path.posix.relative(
    fromDir === "." ? "" : fromDir,
    targetOutputPath,
  );

  return relativePath || path.posix.basename(targetOutputPath);
}
