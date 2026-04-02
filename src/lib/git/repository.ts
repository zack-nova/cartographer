import { SourceRepositoryError } from "../../errors/source-repository.js";
import { runGit, runGitOrNull } from "./run-git.js";

export async function resolveRepoRoot(repoLocator: string): Promise<string> {
  const result = await runGitOrNull(repoLocator, [
    "rev-parse",
    "--show-toplevel",
  ]);

  if (result === null) {
    throw new SourceRepositoryError(
      "Source path is not inside a Git repository",
    );
  }

  return result.stdout.trim();
}

export async function resolveRef(
  repoRoot: string,
  requestedRef?: string,
): Promise<{
  requestedRef: string | null;
  resolvedRef: string;
  commit: string;
}> {
  if (requestedRef) {
    const commit = await resolveCommit(repoRoot, requestedRef);

    return {
      requestedRef,
      resolvedRef: requestedRef,
      commit,
    };
  }

  const branchResult = await runGitOrNull(repoRoot, [
    "symbolic-ref",
    "--quiet",
    "--short",
    "HEAD",
  ]);
  const resolvedRef = branchResult?.stdout.trim() || "HEAD";
  const commit = await resolveCommit(repoRoot, resolvedRef);

  return {
    requestedRef: null,
    resolvedRef,
    commit,
  };
}

export async function readTextFileAtRef(
  repoRoot: string,
  commit: string,
  filePath: string,
): Promise<string> {
  const result = await runGit(repoRoot, ["show", `${commit}:${filePath}`]);

  return result.stdout;
}

export async function fileExistsAtRef(
  repoRoot: string,
  commit: string,
  filePath: string,
): Promise<boolean> {
  const result = await runGitOrNull(repoRoot, [
    "cat-file",
    "-t",
    `${commit}:${filePath}`,
  ]);

  return result?.stdout.trim() === "blob";
}

async function resolveCommit(repoRoot: string, ref: string): Promise<string> {
  const result = await runGitOrNull(repoRoot, ["rev-parse", "--verify", ref]);

  if (result === null) {
    throw new SourceRepositoryError(`Unable to resolve source ref: ${ref}`);
  }

  return result.stdout.trim();
}
