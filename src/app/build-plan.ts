import { readTextFileAtRef } from "../lib/git/repository.js";
import type { BuildPlanInput, CurationPlan } from "../domain/curation/types.js";
import { buildCurationPlan } from "../domain/curation/build-curation-plan.js";
import { normalizeProviderPlanSuggestions } from "../domain/providers/normalize-provider-plan-suggestions.js";
import type {
  ProviderPlanSuggestionRequest,
  ProviderPlanSuggestions,
} from "../domain/providers/types.js";

export async function buildPlan(input: BuildPlanInput): Promise<CurationPlan> {
  const deterministicPlan = buildCurationPlan(input);

  if (input.provider === undefined) {
    return deterministicPlan;
  }

  const providerSuggestions = await loadProviderSuggestions(
    input,
    deterministicPlan,
  );

  if (providerSuggestions === null) {
    return deterministicPlan;
  }

  try {
    return buildCurationPlan(input, providerSuggestions);
  } catch {
    return deterministicPlan;
  }
}

async function loadProviderSuggestions(
  input: BuildPlanInput,
  deterministicPlan: CurationPlan,
): Promise<ProviderPlanSuggestions | null> {
  try {
    const promptInput = await buildProviderPromptInput(
      input,
      deterministicPlan,
    );
    const rawSuggestions =
      await input.provider?.suggestPlanAdjustments(promptInput);

    return normalizeProviderPlanSuggestions(rawSuggestions, {
      discoveredPaths: input.discovery.discoveredPaths,
      edges: input.discovery.edges,
    });
  } catch {
    return null;
  }
}

async function buildProviderPromptInput(
  input: BuildPlanInput,
  deterministicPlan: CurationPlan,
): Promise<ProviderPlanSuggestionRequest> {
  const markdownFiles = await Promise.all(
    input.discovery.discoveredPaths
      .filter((filePath) => filePath.endsWith(".md"))
      .map(async (filePath) => ({
        path: filePath,
        content: await readTextFileAtRef(
          input.source.rootDir,
          input.source.commit,
          filePath,
        ),
      })),
  );

  return {
    source: input.source,
    discovery: input.discovery,
    deterministicPlan,
    markdownFiles,
  };
}
