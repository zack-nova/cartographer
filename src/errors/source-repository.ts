export class SourceRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SourceRepositoryError";
  }
}
