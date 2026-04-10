/**
 * Error thrown when a circular dependency is detected.
 */
export class CircularDependencyError extends Error {
  constructor(token: unknown, chain?: string[]) {
    const name = typeof token === "object" && token !== null && "name" in token
      ? String(token.name)
      : String(token);
    const chainStr = chain ? ` [${chain.join(" → ")}]` : "";
    super(`Circular dependency detected for "${name}"${chainStr}`);
    this.name = "CircularDependencyError";
  }
}
