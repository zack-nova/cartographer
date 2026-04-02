import type { ProviderPlanSuggestionRequest } from "./types.js";

export function buildProviderPlanSuggestionPrompt(
  input: ProviderPlanSuggestionRequest,
): string {
  return JSON.stringify(
    {
      source: input.source,
      discovery: input.discovery,
      deterministicPlan: input.deterministicPlan,
      markdownFiles: input.markdownFiles,
    },
    null,
    2,
  );
}
