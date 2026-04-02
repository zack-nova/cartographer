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

  if (
    resolvedPath.length === 0 ||
    resolvedPath === "." ||
    resolvedPath.startsWith("../") ||
    path.posix.isAbsolute(resolvedPath)
  ) {
    return null;
  }

  return resolvedPath;
}
