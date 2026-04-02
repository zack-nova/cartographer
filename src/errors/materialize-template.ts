export class MaterializeTemplateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MaterializeTemplateError";
  }
}
