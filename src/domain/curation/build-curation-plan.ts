import path from "node:path";

import { CurationPlanError } from "../../errors/curation-plan.js";
import {
  buildRelativeOutputLink,
  normalizeRepoRelativePath,
} from "../../lib/paths/repo-paths.js";
import { curationPlanSchema } from "../../schema/curation-plan.js";
import type {
  BuildPlanInput,
  CurationFilePlan,
  CurationPlan,
  LinkRewritePlan,
} from "./types.js";
import { validateVariableDeclarations } from "../variables/validate-variable-declarations.js";

const claudeAdapterOutputPath = "docs/_adapters/claude-code-entry.md";
const defaultOrbitId = "workspace";

export function buildCurationPlan(input: BuildPlanInput): CurationPlan {
  const discoveredPaths = [...input.discovery.discoveredPaths];
  const excludePaths = normalizePathList(input.excludePaths);
  const explicitRollingPaths = normalizePathList(input.rollingPaths);
  const hasRootAgents = discoveredPaths.includes("AGENTS.md");
  const hasRootClaude = discoveredPaths.includes("CLAUDE.md");
  const variables = validateVariableDeclarations(
    input.variables,
    discoveredPaths,
  );
  const files = discoveredPaths.map((filePath) =>
    buildFilePlan({
      filePath,
      excludePaths,
      explicitRollingPaths,
      hasRootAgents,
      hasRootClaude,
    }),
  );

  validateOutputPathConflicts(files);

  const filePlansByPath = new Map(
    files.map((filePlan) => [filePlan.path, filePlan]),
  );
  const rewrites = buildRewritePlans(input, filePlansByPath);
  const plan = curationPlanSchema.parse({
    version: 1,
    source: input.source,
    discoveredPaths,
    harnessId: input.harnessId ?? deriveHarnessId(input.source.rootDir),
    orbitId: input.orbitId ?? defaultOrbitId,
    status: "draft",
    files,
    rewrites,
    variables,
  });

  return plan;
}

function buildFilePlan({
  filePath,
  excludePaths,
  explicitRollingPaths,
  hasRootAgents,
  hasRootClaude,
}: {
  filePath: string;
  excludePaths: Set<string>;
  explicitRollingPaths: Set<string>;
  hasRootAgents: boolean;
  hasRootClaude: boolean;
}): CurationFilePlan {
  if (excludePaths.has(filePath)) {
    return {
      path: filePath,
      decision: "drop",
      reason: "excluded by explicit rule",
    };
  }

  if (explicitRollingPaths.has(filePath)) {
    return {
      path: filePath,
      decision: "rolling_pointer",
      reason: "marked rolling by explicit rule",
      outputPath: buildRollingPointerOutputPath(filePath),
    };
  }

  if (matchesRollingHeuristic(filePath)) {
    return {
      path: filePath,
      decision: "rolling_pointer",
      reason: "matched rolling heuristic",
      outputPath: buildRollingPointerOutputPath(filePath),
    };
  }

  if (hasRootAgents && hasRootClaude && filePath === "CLAUDE.md") {
    return {
      path: filePath,
      decision: "keep",
      reason: "root Claude entry retained as adapter content",
      outputPath: claudeAdapterOutputPath,
    };
  }

  return {
    path: filePath,
    decision: "keep",
    outputPath: filePath,
  };
}

function validateOutputPathConflicts(files: CurationFilePlan[]): void {
  const outputPathToSource = new Map<string, string>();

  for (const file of files) {
    if (file.outputPath === undefined) {
      continue;
    }

    const existingSource = outputPathToSource.get(file.outputPath);

    if (existingSource !== undefined && existingSource !== file.path) {
      throw new CurationPlanError(
        `Planned output path conflict: ${file.outputPath}`,
      );
    }

    outputPathToSource.set(file.outputPath, file.path);
  }
}

function buildRewritePlans(
  input: BuildPlanInput,
  filePlansByPath: Map<string, CurationFilePlan>,
): LinkRewritePlan[] {
  const rewrites: LinkRewritePlan[] = [];

  for (const edge of input.discovery.edges) {
    const sourcePlan = filePlansByPath.get(edge.from);
    const targetPlan = filePlansByPath.get(edge.to);

    if (
      sourcePlan === undefined ||
      targetPlan === undefined ||
      sourcePlan.decision !== "keep" ||
      targetPlan.decision === "drop" ||
      sourcePlan.outputPath === undefined ||
      targetPlan.outputPath === undefined
    ) {
      continue;
    }

    const sourceMoved = sourcePlan.outputPath !== sourcePlan.path;
    const targetMoved = targetPlan.outputPath !== targetPlan.path;

    if (!sourceMoved && !targetMoved) {
      continue;
    }

    rewrites.push({
      from: edge.from,
      to: edge.to,
      sourceOutputPath: sourcePlan.outputPath,
      targetOutputPath: targetPlan.outputPath,
      replacementHref: buildRelativeOutputLink(
        sourcePlan.outputPath,
        targetPlan.outputPath,
      ),
    });
  }

  return rewrites.sort(compareRewritePlans);
}

function normalizePathList(paths: string[] | undefined): Set<string> {
  const normalizedPaths = new Set<string>();

  for (const filePath of paths ?? []) {
    const normalizedPath = normalizeRepoRelativePath(filePath);

    if (normalizedPath === null) {
      throw new CurationPlanError(`Invalid repo-relative path: ${filePath}`);
    }

    normalizedPaths.add(normalizedPath);
  }

  return normalizedPaths;
}

function matchesRollingHeuristic(filePath: string): boolean {
  const fileName = path.posix.basename(filePath);

  return /^(changelog|release[-_ ]notes?|todo|backlog|status)(\..+)?$/i.test(
    fileName,
  );
}

function buildRollingPointerOutputPath(filePath: string): string {
  const baseName = path.posix.basename(filePath, path.posix.extname(filePath));
  const slug = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `docs/_rolling/${slug || "entry"}.md`;
}

function deriveHarnessId(rootDir: string): string {
  const directoryName = path.basename(rootDir);
  const sanitized = directoryName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return sanitized || "cartographer_template";
}

function compareRewritePlans(
  left: LinkRewritePlan,
  right: LinkRewritePlan,
): number {
  const fromComparison = left.from.localeCompare(right.from);

  if (fromComparison !== 0) {
    return fromComparison;
  }

  return left.to.localeCompare(right.to);
}
