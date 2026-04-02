import type {
  CurationDecision,
  CurationPlan,
  VariableDeclaration,
} from "../curation/types.js";
import type {
  DiscoveryEdge,
  DiscoveryGraph,
  SourceSnapshot,
} from "../source/types.js";

export type ProviderFileSuggestion = {
  path: string;
  decision: CurationDecision;
  reason?: string;
};

export type ProviderRewriteSuggestion = {
  from: string;
  to: string;
  reason: string;
};

export type ProviderPlanSuggestions = {
  fileSuggestions: ProviderFileSuggestion[];
  rewriteSuggestions: ProviderRewriteSuggestion[];
  variables: VariableDeclaration[];
};

export type ProviderPlanSuggestionRequest = {
  source: SourceSnapshot;
  discovery: DiscoveryGraph;
  deterministicPlan: CurationPlan;
  markdownFiles: Array<{
    path: string;
    content: string;
  }>;
};

export type ProviderSuggestionValidationContext = {
  discoveredPaths: string[];
  edges: DiscoveryEdge[];
};

export interface PlanSuggestionProvider {
  name: string;
  suggestPlanAdjustments(
    input: ProviderPlanSuggestionRequest,
  ): Promise<unknown>;
}
