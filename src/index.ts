import { discoverSource as discoverSourceApp } from "./app/discover-source.js";
import { rejectNotImplemented } from "./errors/not-implemented.js";
import type {
  DiscoverSourceInput,
  DiscoverSourceResult,
} from "./domain/source/types.js";

export async function discoverSource(
  input: DiscoverSourceInput,
): Promise<DiscoverSourceResult> {
  return discoverSourceApp(input);
}

export function buildPlan(): Promise<never> {
  return rejectNotImplemented("buildPlan");
}

export function materializeTemplate(): Promise<never> {
  return rejectNotImplemented("materializeTemplate");
}

export function bootstrapRepository(): Promise<never> {
  return rejectNotImplemented("bootstrapRepository");
}
