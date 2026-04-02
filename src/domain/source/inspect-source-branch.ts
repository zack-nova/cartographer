import { fileExistsAtRef } from "../../lib/git/repository.js";
import type { SourceBranchType, SourceSnapshot } from "./types.js";

export async function inspectSourceBranchType(
  snapshot: SourceSnapshot,
): Promise<SourceBranchType> {
  if (
    await fileExistsAtRef(
      snapshot.rootDir,
      snapshot.commit,
      ".harness/template.yaml",
    )
  ) {
    return "harness_template_branch";
  }

  if (
    await fileExistsAtRef(
      snapshot.rootDir,
      snapshot.commit,
      ".orbit/template.yaml",
    )
  ) {
    return "orbit_template_branch";
  }

  return "plain_branch";
}
