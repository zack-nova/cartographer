export class CurationPlanError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CurationPlanError";
  }
}
