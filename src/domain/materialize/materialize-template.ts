import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { MaterializeTemplateError } from "../../errors/materialize-template.js";
import { readTextFileAtRef } from "../../lib/git/repository.js";
import { normalizeRepoRelativePath } from "../../lib/paths/repo-paths.js";
import type { CurationFilePlan, CurationPlan } from "../curation/types.js";
import type {
  MaterializeTemplateInput,
  MaterializeTemplateResult,
} from "./types.js";
import { normalizeRootAgentsContent } from "./normalize-root-agents.js";
import {
  renderOrbitDefinition,
  renderTemplateManifest,
} from "./render-manifests.js";
import { rewriteMarkdownContent } from "./rewrite-markdown-content.js";

const forbiddenOutputPaths = new Set([
  ".orbit/config.yaml",
  ".harness/runtime.yaml",
  ".harness/vars.yaml",
]);

export async function materializeTemplate(
  input: MaterializeTemplateInput,
): Promise<MaterializeTemplateResult> {
  if (input.plan.status !== "approved") {
    throw new MaterializeTemplateError(
      "materializeTemplate requires an approved plan",
    );
  }

  const createdAt = input.createdAt ?? new Date().toISOString();
  const filesToWrite = new Map<string, string>();
  const rootAgentsSourcePath = resolveRootAgentsSourcePath(input.plan);
  const materializedContentPaths: string[] = [];

  for (const filePlan of input.plan.files) {
    const outputPath = resolveEffectiveOutputPath(filePlan, input.plan);

    if (outputPath === null) {
      continue;
    }

    validateOutputPath(outputPath);

    if (filePlan.decision === "keep") {
      const content = await buildMaterializedFileContent(
        input.plan,
        filePlan,
        outputPath,
      );

      filesToWrite.set(outputPath, content);
      materializedContentPaths.push(outputPath);
      continue;
    }

    if (filePlan.decision === "rolling_pointer") {
      filesToWrite.set(outputPath, buildRollingPointerContent(filePlan));
      materializedContentPaths.push(outputPath);
    }
  }

  if (rootAgentsSourcePath === null) {
    throw new MaterializeTemplateError(
      "materializeTemplate requires a root entry file",
    );
  }

  const includesRootAgents = rootAgentsSourcePath === "AGENTS.md";
  const templateManifestPath = ".harness/template.yaml";
  const orbitDefinitionPath = `.orbit/orbits/${input.plan.orbitId}.yaml`;

  filesToWrite.set(
    templateManifestPath,
    renderTemplateManifest({
      plan: input.plan,
      createdAt,
      includesRootAgents,
    }),
  );
  filesToWrite.set(
    orbitDefinitionPath,
    renderOrbitDefinition({
      orbitId: input.plan.orbitId,
      includePaths: [...materializedContentPaths].sort(),
    }),
  );

  for (const [relativePath, content] of filesToWrite) {
    const absolutePath = path.join(input.outputDir, relativePath);

    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, content, "utf8");
  }

  return {
    outputDir: input.outputDir,
    writtenPaths: [...filesToWrite.keys()].sort(),
  };
}

async function buildMaterializedFileContent(
  plan: CurationPlan,
  filePlan: CurationFilePlan,
  effectiveOutputPath: string,
): Promise<string> {
  let content = await readTextFileAtRef(
    plan.source.rootDir,
    plan.source.commit,
    filePlan.path,
  );

  if (filePlan.path === "AGENTS.md") {
    content = normalizeRootAgentsContent(content);
  }

  content = rewriteMarkdownContent(
    content,
    filePlan.path,
    plan.rewrites.filter((rewrite) => rewrite.from === filePlan.path),
  );
  content = applyVariableReplacements(content, filePlan.path, plan);

  if (filePlan.path === "CLAUDE.md" && effectiveOutputPath === "AGENTS.md") {
    return content;
  }

  return content;
}

function buildRollingPointerContent(filePlan: CurationFilePlan): string {
  return [
    "# Rolling Content Pointer",
    "",
    `- source_path: ${filePlan.path}`,
    `- reason: ${filePlan.reason ?? "rolling content"}`,
    "",
    "This template intentionally excludes the rolling source content.",
  ].join("\n");
}

function applyVariableReplacements(
  content: string,
  filePath: string,
  plan: CurationPlan,
): string {
  let replacedContent = content;

  for (const variable of plan.variables) {
    for (const replacement of variable.replacements) {
      if (replacement.path !== filePath) {
        continue;
      }

      replacedContent = replacedContent
        .split(replacement.literal)
        .join(`$${variable.name}`);
    }
  }

  return replacedContent;
}

function resolveRootAgentsSourcePath(plan: CurationPlan): string | null {
  const rootAgentsPlan = plan.files.find(
    (filePlan) => filePlan.path === "AGENTS.md" && filePlan.decision === "keep",
  );

  if (rootAgentsPlan !== undefined) {
    return "AGENTS.md";
  }

  const rootClaudePlan = plan.files.find(
    (filePlan) => filePlan.path === "CLAUDE.md" && filePlan.decision === "keep",
  );

  return rootClaudePlan === undefined ? null : "CLAUDE.md";
}

function resolveEffectiveOutputPath(
  filePlan: CurationFilePlan,
  plan: CurationPlan,
): string | null {
  if (filePlan.decision === "drop") {
    return null;
  }

  if (filePlan.outputPath === undefined) {
    throw new MaterializeTemplateError(
      `Materialize file is missing outputPath: ${filePlan.path}`,
    );
  }

  const hasRootAgents = plan.files.some(
    (candidate) =>
      candidate.path === "AGENTS.md" && candidate.decision === "keep",
  );

  if (
    filePlan.path === "CLAUDE.md" &&
    !hasRootAgents &&
    filePlan.outputPath === "CLAUDE.md"
  ) {
    return "AGENTS.md";
  }

  return filePlan.outputPath;
}

function validateOutputPath(outputPath: string): void {
  const normalizedPath = normalizeRepoRelativePath(outputPath);

  if (normalizedPath === null || normalizedPath !== outputPath) {
    throw new MaterializeTemplateError(`Invalid output path: ${outputPath}`);
  }

  if (outputPath.startsWith(".git/") || forbiddenOutputPaths.has(outputPath)) {
    throw new MaterializeTemplateError(`Forbidden output path: ${outputPath}`);
  }
}
