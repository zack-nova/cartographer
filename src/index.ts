import { rejectNotImplemented } from "./errors/not-implemented.js";

export function discoverSource(): Promise<never> {
  return rejectNotImplemented("discoverSource");
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
