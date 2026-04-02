import { z } from "zod";

export const variableReplacementSchema = z.object({
  path: z.string().min(1),
  literal: z.string().min(1),
});

export const variableDeclarationSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1).optional(),
  replacements: z.array(variableReplacementSchema),
});

export const curationFilePlanSchema = z.object({
  path: z.string().min(1),
  decision: z.enum(["keep", "drop", "rolling_pointer"]),
  reason: z.string().min(1).optional(),
  outputPath: z.string().min(1).optional(),
});

export const linkRewritePlanSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  sourceOutputPath: z.string().min(1),
  targetOutputPath: z.string().min(1),
  replacementHref: z.string().min(1),
  reason: z.string().min(1).optional(),
});

export const sourceSnapshotSchema = z.object({
  repoLocator: z.string().min(1),
  requestedRef: z.string().min(1).nullable(),
  resolvedRef: z.string().min(1),
  commit: z.string().regex(/^[0-9a-f]{40}$/),
  rootDir: z.string().min(1),
});

export const curationPlanSchema = z.object({
  version: z.literal(1),
  source: sourceSnapshotSchema,
  discoveredPaths: z.array(z.string().min(1)),
  harnessId: z.string().min(1),
  orbitId: z.string().min(1),
  status: z.enum(["draft", "approved"]),
  files: z.array(curationFilePlanSchema),
  rewrites: z.array(linkRewritePlanSchema),
  variables: z.array(variableDeclarationSchema),
});
