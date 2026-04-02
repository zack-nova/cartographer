import { buildPlan as buildPlanApp } from "./app/build-plan.js";
import { discoverSource as discoverSourceApp } from "./app/discover-source.js";
import { materializeTemplate as materializeTemplateApp } from "./app/materialize-template.js";
import { rejectNotImplemented } from "./errors/not-implemented.js";
import type { BuildPlanInput, CurationPlan } from "./domain/curation/types.js";
import type {
  MaterializeTemplateInput,
  MaterializeTemplateResult,
} from "./domain/materialize/types.js";
import type {
  DiscoverSourceInput,
  DiscoverSourceResult,
} from "./domain/source/types.js";

export async function discoverSource(
  input: DiscoverSourceInput,
): Promise<DiscoverSourceResult> {
  return discoverSourceApp(input);
}

export async function buildPlan(input: BuildPlanInput): Promise<CurationPlan> {
  return buildPlanApp(input);
}

export async function materializeTemplate(
  input: MaterializeTemplateInput,
): Promise<MaterializeTemplateResult> {
  return materializeTemplateApp(input);
}

export function bootstrapRepository(): Promise<never> {
  return rejectNotImplemented("bootstrapRepository");
}
