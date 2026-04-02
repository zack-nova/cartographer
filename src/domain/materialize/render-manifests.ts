import type { CurationPlan } from "../curation/types.js";

export function renderTemplateManifest(params: {
  plan: CurationPlan;
  createdAt: string;
  includesRootAgents: boolean;
}): string {
  const { plan, createdAt, includesRootAgents } = params;
  const lines = [
    "schema_version: 1",
    "kind: harness_template",
    "template:",
    `  harness_id: ${plan.harnessId}`,
    "  default_template: false",
    `  created_from_branch: ${plan.source.resolvedRef}`,
    `  created_from_commit: ${plan.source.commit}`,
    `  created_at: ${createdAt}`,
    `  includes_root_agents: ${includesRootAgents ? "true" : "false"}`,
    "members:",
    `  - orbit_id: ${plan.orbitId}`,
    "variables:",
  ];

  if (plan.variables.length === 0) {
    lines.push("  []");
    return lines.join("\n");
  }

  for (const variable of plan.variables) {
    lines.push(`  - name: ${variable.name}`);

    if (variable.description !== undefined) {
      lines.push(`    description: ${variable.description}`);
    }
  }

  return lines.join("\n");
}

export function renderOrbitDefinition(params: {
  orbitId: string;
  includePaths: string[];
}): string {
  const { orbitId, includePaths } = params;
  const lines = [
    "schema_version: 1",
    "orbit:",
    `  id: ${orbitId}`,
    "  description: Workspace template orbit",
    "  include:",
  ];

  for (const includePath of includePaths) {
    lines.push(`    - ${includePath}`);
  }

  return lines.join("\n");
}
