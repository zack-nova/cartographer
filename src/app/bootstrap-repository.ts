import type {
  BootstrapRepositoryInput,
  BootstrapRepositoryResult,
} from "../domain/bootstrap/types.js";
import { loadSourceSnapshot } from "../domain/source/load-source-snapshot.js";
import { inspectSourceBranchType } from "../domain/source/inspect-source-branch.js";
import { discoverGraph } from "../domain/discovery/discover-graph.js";
import { buildPlan } from "./build-plan.js";
import { materializeTemplate } from "./materialize-template.js";
import { BootstrapRepositoryError } from "../errors/bootstrap-repository.js";

export async function bootstrapRepository(
  input: BootstrapRepositoryInput,
): Promise<BootstrapRepositoryResult> {
  const source = await loadSourceSnapshot({
    repoLocator: input.repoLocator,
    ref: input.ref,
  });
  const sourceType = await inspectSourceBranchType(source);

  if (sourceType === "harness_template_branch") {
    throw new BootstrapRepositoryError(
      "Source branch is already a harness template branch",
    );
  }

  if (sourceType === "orbit_template_branch") {
    throw new BootstrapRepositoryError(
      "Source branch is already an orbit template branch",
    );
  }

  const discovery = await discoverGraph(source);
  const plan = await buildPlan({
    source,
    discovery,
    harnessId: input.harnessId,
    orbitId: input.orbitId,
    excludePaths: input.excludePaths,
    rollingPaths: input.rollingPaths,
    variables: input.variables,
    provider: input.provider,
  });

  if (input.autoApprove !== true) {
    return {
      sourceType,
      discovery,
      plan,
    };
  }

  if (input.outputDir === undefined) {
    throw new BootstrapRepositoryError(
      "bootstrapRepository requires outputDir when autoApprove is enabled",
    );
  }

  const approvedPlan = {
    ...plan,
    status: "approved" as const,
  };
  const materialized = await materializeTemplate({
    plan: approvedPlan,
    outputDir: input.outputDir,
    createdAt: input.createdAt,
  });

  return {
    sourceType,
    discovery,
    plan: approvedPlan,
    materialized,
  };
}
