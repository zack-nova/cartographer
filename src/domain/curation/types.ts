import type { DiscoveryGraph, SourceSnapshot } from "../source/types.js";
import type { PlanSuggestionProvider } from "../providers/types.js";

export type CurationDecision = "keep" | "drop" | "rolling_pointer";

export type VariableReplacement = {
  path: string;
  literal: string;
};

export type VariableDeclaration = {
  name: string;
  description?: string;
  replacements: VariableReplacement[];
};

export type CurationFilePlan = {
  path: string;
  decision: CurationDecision;
  reason?: string;
  outputPath?: string;
};

export type LinkRewritePlan = {
  from: string;
  to: string;
  sourceOutputPath: string;
  targetOutputPath: string;
  replacementHref: string;
  reason?: string;
};

export type CurationPlan = {
  version: 1;
  source: SourceSnapshot;
  discoveredPaths: string[];
  harnessId: string;
  orbitId: string;
  status: "draft" | "approved";
  files: CurationFilePlan[];
  rewrites: LinkRewritePlan[];
  variables: VariableDeclaration[];
};

export type BuildPlanInput = {
  source: SourceSnapshot;
  discovery: DiscoveryGraph;
  harnessId?: string;
  orbitId?: string;
  excludePaths?: string[];
  rollingPaths?: string[];
  variables?: VariableDeclaration[];
  provider?: PlanSuggestionProvider;
};
