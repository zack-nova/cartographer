import { z } from "zod";

import { variableDeclarationSchema } from "./curation-plan.js";

export const providerFileSuggestionSchema = z.object({
  path: z.string().min(1),
  decision: z.enum(["keep", "drop", "rolling_pointer"]),
  reason: z.string().min(1).optional(),
});

export const providerRewriteSuggestionSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  reason: z.string().min(1),
});

export const providerPlanSuggestionsSchema = z.object({
  fileSuggestions: z.array(providerFileSuggestionSchema).default([]),
  rewriteSuggestions: z.array(providerRewriteSuggestionSchema).default([]),
  variables: z.array(variableDeclarationSchema).default([]),
});
