import type { CurationPlan, VariableDeclaration } from "../curation/types.js";
import type { MaterializeTemplateResult } from "../materialize/types.js";
import type { PlanSuggestionProvider } from "../providers/types.js";
import type { DiscoveryGraph, SourceBranchType } from "../source/types.js";

export type BootstrapRepositoryInput = {
  repoLocator: string;
  ref?: string;
  outputDir?: string;
  autoApprove?: boolean;
  createdAt?: string;
  harnessId?: string;
  orbitId?: string;
  excludePaths?: string[];
  rollingPaths?: string[];
  variables?: VariableDeclaration[];
  provider?: PlanSuggestionProvider;
};

export type BootstrapRepositoryResult = {
  sourceType: SourceBranchType;
  discovery: DiscoveryGraph;
  plan: CurationPlan;
  materialized?: MaterializeTemplateResult;
};
