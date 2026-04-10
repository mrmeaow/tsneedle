/**
 * Error thrown when a circular dependency is detected.
 */
export class CircularDependencyError extends Error {
  constructor(token: unknown, chain?: unknown[]) {
    const name = typeof token === "object" && token !== null && "name" in token
      ? String(token.name)
      : String(token);
    const chainStr = chain && chain.length > 0
      ? ` [${chain.map((c) => typeof c === "object" && c !== null && "name" in c ? String((c as any).name) : String(c)).join(" → ")}]`
      : "";
    super(`Circular dependency detected for "${name}"${chainStr}`);
    this.name = "CircularDependencyError";
  }
}
