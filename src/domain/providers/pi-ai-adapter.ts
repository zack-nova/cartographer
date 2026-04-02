import { buildProviderPlanSuggestionPrompt } from "./prompt.js";
import type {
  PlanSuggestionProvider,
  ProviderPlanSuggestionRequest,
} from "./types.js";

type PiAiClient = {
  generateObject(input: {
    model: string;
    schemaName: string;
    systemPrompt: string;
    userPrompt: string;
  }): Promise<unknown>;
};

type CreatePiAiPlanSuggestionProviderInput = {
  client: PiAiClient;
  model: string;
};

const schemaName = "cartographer_provider_plan_suggestions_v1";
const systemPrompt = [
  "You produce structured curation suggestions for Cartographer.",
  "Return only schema-valid plan suggestions.",
  "Do not propose file writes or direct output mutations.",
].join(" ");

export function createPiAiPlanSuggestionProvider(
  input: CreatePiAiPlanSuggestionProviderInput,
): PlanSuggestionProvider {
  return {
    name: "pi-ai",
    async suggestPlanAdjustments(
      request: ProviderPlanSuggestionRequest,
    ): Promise<unknown> {
      return input.client.generateObject({
        model: input.model,
        schemaName,
        systemPrompt,
        userPrompt: buildProviderPlanSuggestionPrompt(request),
      });
    },
  };
}
