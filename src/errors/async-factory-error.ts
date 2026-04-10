/**
 * Error thrown when an async factory throws during resolution.
 */
export class AsyncFactoryError extends Error {
  constructor(token: unknown, cause?: unknown) {
    const name = typeof token === "object" && token !== null && "name" in token
      ? String(token.name)
      : String(token);
    super(`Async factory for "${name}" threw an error`);
    this.name = "AsyncFactoryError";
    this.cause = cause;
  }
}
