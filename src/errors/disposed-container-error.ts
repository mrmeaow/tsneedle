/**
 * Error thrown when trying to resolve from a disposed container.
 */
export class DisposedContainerError extends Error {
  constructor() {
    super("Cannot resolve from a disposed container");
    this.name = "DisposedContainerError";
  }
}
