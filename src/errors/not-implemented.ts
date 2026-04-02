export class NotImplementedPhase0Error extends Error {
  constructor(entrypointName: string) {
    super(`${entrypointName} is not implemented yet`);
    this.name = "NotImplementedPhase0Error";
  }
}

export function rejectNotImplemented(entrypointName: string): Promise<never> {
  return Promise.reject(new NotImplementedPhase0Error(entrypointName));
}
