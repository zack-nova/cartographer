import { readFile } from "node:fs/promises";

import {
  bootstrapRepository,
  buildPlan,
  discoverSource,
  materializeTemplate,
} from "../src/index.js";
import { curationPlanSchema } from "../src/schema/curation-plan.js";

type ParsedArgv = {
  command: string | null;
  flags: Map<string, string[]>;
  booleans: Set<string>;
};

await main();

async function main(): Promise<void> {
  try {
    const parsedArgv = parseArgv(process.argv.slice(2));

    switch (parsedArgv.command) {
      case null:
      case "help":
        printHelp();
        return;
      case "discover":
        await runDiscoverCommand(parsedArgv);
        return;
      case "build-plan":
        await runBuildPlanCommand(parsedArgv);
        return;
      case "materialize":
        await runMaterializeCommand(parsedArgv);
        return;
      case "bootstrap":
        await runBootstrapCommand(parsedArgv);
        return;
      default:
        throw new Error(`Unknown command: ${parsedArgv.command}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  }
}

async function runDiscoverCommand(parsedArgv: ParsedArgv): Promise<void> {
  const result = await discoverSource({
    repoLocator: getRequiredFlagValue(parsedArgv, "repo"),
    ref: getOptionalFlagValue(parsedArgv, "ref"),
  });

  writeCommandOutput(parsedArgv, result, (payload) =>
    [
      "Discovery complete",
      `- repo: ${payload.source.rootDir}`,
      `- ref: ${payload.source.resolvedRef}`,
      `- seeds: ${payload.discovery.seedPaths.length}`,
      `- discovered: ${payload.discovery.discoveredPaths.length}`,
      `- edges: ${payload.discovery.edges.length}`,
    ].join("\n"),
  );
}

async function runBuildPlanCommand(parsedArgv: ParsedArgv): Promise<void> {
  const discovered = await discoverSource({
    repoLocator: getRequiredFlagValue(parsedArgv, "repo"),
    ref: getOptionalFlagValue(parsedArgv, "ref"),
  });
  const plan = await buildPlan({
    ...discovered,
    harnessId: getOptionalFlagValue(parsedArgv, "harness-id"),
    orbitId: getOptionalFlagValue(parsedArgv, "orbit-id"),
    excludePaths: getMultiFlagValues(parsedArgv, "exclude"),
    rollingPaths: getMultiFlagValues(parsedArgv, "rolling"),
  });

  writeCommandOutput(parsedArgv, plan, (payload) =>
    [
      "Curation plan complete",
      `- harness_id: ${payload.harnessId}`,
      `- orbit_id: ${payload.orbitId}`,
      `- status: ${payload.status}`,
      `- files: ${payload.files.length}`,
      `- rewrites: ${payload.rewrites.length}`,
      `- variables: ${payload.variables.length}`,
    ].join("\n"),
  );
}

async function runMaterializeCommand(parsedArgv: ParsedArgv): Promise<void> {
  const planPath = getRequiredFlagValue(parsedArgv, "plan");
  const rawPlan = JSON.parse(await readFile(planPath, "utf8")) as unknown;
  const plan = curationPlanSchema.parse(rawPlan);
  const result = await materializeTemplate({
    plan,
    outputDir: getRequiredFlagValue(parsedArgv, "output"),
    createdAt: getOptionalFlagValue(parsedArgv, "created-at"),
  });

  writeCommandOutput(parsedArgv, result, (payload) =>
    [
      "Materialize complete",
      `- output: ${payload.outputDir}`,
      `- written: ${payload.writtenPaths.length}`,
    ].join("\n"),
  );
}

async function runBootstrapCommand(parsedArgv: ParsedArgv): Promise<void> {
  const result = await bootstrapRepository({
    repoLocator: getRequiredFlagValue(parsedArgv, "repo"),
    ref: getOptionalFlagValue(parsedArgv, "ref"),
    outputDir: getOptionalFlagValue(parsedArgv, "output"),
    autoApprove: parsedArgv.booleans.has("auto-approve"),
    createdAt: getOptionalFlagValue(parsedArgv, "created-at"),
    harnessId: getOptionalFlagValue(parsedArgv, "harness-id"),
    orbitId: getOptionalFlagValue(parsedArgv, "orbit-id"),
    excludePaths: getMultiFlagValues(parsedArgv, "exclude"),
    rollingPaths: getMultiFlagValues(parsedArgv, "rolling"),
  });

  writeCommandOutput(parsedArgv, result, (payload) =>
    [
      "Bootstrap complete",
      `- source_type: ${payload.sourceType}`,
      `- plan_status: ${payload.plan.status}`,
      `- discovered: ${payload.discovery.discoveredPaths.length}`,
      `- materialized: ${payload.materialized?.writtenPaths.length ?? 0}`,
    ].join("\n"),
  );
}

function parseArgv(argv: string[]): ParsedArgv {
  let command: string | null = null;
  const flags = new Map<string, string[]>();
  const booleans = new Set<string>();

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];

    if (!current.startsWith("--")) {
      if (command !== null) {
        throw new Error(`Unexpected positional argument: ${current}`);
      }

      command = current;
      continue;
    }

    const flagName = current.slice(2);
    const next = argv[index + 1];

    if (next === undefined || next.startsWith("--")) {
      booleans.add(flagName);
      continue;
    }

    const existing = flags.get(flagName) ?? [];
    existing.push(next);
    flags.set(flagName, existing);
    index += 1;
  }

  return {
    command,
    flags,
    booleans,
  };
}

function getRequiredFlagValue(
  parsedArgv: ParsedArgv,
  flagName: string,
): string {
  const value = getOptionalFlagValue(parsedArgv, flagName);

  if (value === undefined) {
    throw new Error(`Missing required flag: --${flagName}`);
  }

  return value;
}

function getOptionalFlagValue(
  parsedArgv: ParsedArgv,
  flagName: string,
): string | undefined {
  const values = parsedArgv.flags.get(flagName);

  if (values === undefined || values.length === 0) {
    return undefined;
  }

  if (values.length > 1) {
    throw new Error(`Flag must be provided at most once: --${flagName}`);
  }

  return values[0];
}

function getMultiFlagValues(
  parsedArgv: ParsedArgv,
  flagName: string,
): string[] {
  return parsedArgv.flags.get(flagName) ?? [];
}

function writeCommandOutput<T>(
  parsedArgv: ParsedArgv,
  payload: T,
  renderText: (payload: T) => string,
): void {
  if (parsedArgv.booleans.has("json")) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  console.log(renderText(payload));
}

function printHelp(): void {
  console.log(
    [
      "Cartographer development commands",
      "",
      "discover --repo <path> [--ref <ref>] [--json]",
      "build-plan --repo <path> [--ref <ref>] [--harness-id <id>] [--orbit-id <id>] [--exclude <path>]... [--rolling <path>]... [--json]",
      "materialize --plan <path> --output <path> [--created-at <iso>] [--json]",
      "bootstrap --repo <path> [--ref <ref>] [--output <path>] [--auto-approve] [--created-at <iso>] [--harness-id <id>] [--orbit-id <id>] [--exclude <path>]... [--rolling <path>]... [--json]",
    ].join("\n"),
  );
}
