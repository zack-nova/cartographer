import type { BuildPlanInput, CurationPlan } from "../domain/curation/types.js";
import { buildCurationPlan } from "../domain/curation/build-curation-plan.js";

export function buildPlan(input: BuildPlanInput): Promise<CurationPlan> {
  return Promise.resolve(buildCurationPlan(input));
}
