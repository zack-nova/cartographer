import { CurationPlanError } from "../../errors/curation-plan.js";
import { providerPlanSuggestionsSchema } from "../../schema/provider-plan-suggestions.js";
import type {
  ProviderPlanSuggestions,
  ProviderSuggestionValidationContext,
} from "./types.js";

export function normalizeProviderPlanSuggestions(
  rawSuggestions: unknown,
  context: ProviderSuggestionValidationContext,
): ProviderPlanSuggestions {
  const parsedSuggestions = providerPlanSuggestionsSchema.parse(rawSuggestions);
  const discoveredPathSet = new Set(context.discoveredPaths);
  const edgeSet = new Set(
    context.edges.map((edge) => buildEdgeKey(edge.from, edge.to)),
  );

  for (const fileSuggestion of parsedSuggestions.fileSuggestions) {
    if (!discoveredPathSet.has(fileSuggestion.path)) {
      throw new CurationPlanError(
        `Provider suggestion references a path outside the discovery set: ${fileSuggestion.path}`,
      );
    }
  }

  for (const rewriteSuggestion of parsedSuggestions.rewriteSuggestions) {
    const edgeKey = buildEdgeKey(rewriteSuggestion.from, rewriteSuggestion.to);

    if (!edgeSet.has(edgeKey)) {
      throw new CurationPlanError(
        `Provider rewrite suggestion is not part of the discovery graph: ${rewriteSuggestion.from} -> ${rewriteSuggestion.to}`,
      );
    }
  }

  return {
    fileSuggestions: parsedSuggestions.fileSuggestions,
    rewriteSuggestions: parsedSuggestions.rewriteSuggestions,
    variables: parsedSuggestions.variables,
  };
}

function buildEdgeKey(from: string, to: string): string {
  return `${from}->${to}`;
}
