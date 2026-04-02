import type { CurationPlan } from "../curation/types.js";

export type MaterializeTemplateInput = {
  plan: CurationPlan;
  outputDir: string;
  createdAt?: string;
};

export type MaterializeTemplateResult = {
  outputDir: string;
  writtenPaths: string[];
};
