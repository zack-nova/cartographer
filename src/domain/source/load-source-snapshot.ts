import type { DiscoverSourceInput, SourceSnapshot } from "./types.js";
import { resolveRef, resolveRepoRoot } from "../../lib/git/repository.js";

export async function loadSourceSnapshot(
  input: DiscoverSourceInput,
): Promise<SourceSnapshot> {
  const rootDir = await resolveRepoRoot(input.repoLocator);
  const { requestedRef, resolvedRef, commit } = await resolveRef(
    rootDir,
    input.ref,
  );

  return {
    repoLocator: input.repoLocator,
    requestedRef,
    resolvedRef,
    commit,
    rootDir,
  };
}
