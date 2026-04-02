export class BootstrapRepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BootstrapRepositoryError";
  }
}
