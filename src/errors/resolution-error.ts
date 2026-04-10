/**
 * Error thrown when a token cannot be resolved.
 */
export class ResolutionError extends Error {
  /**
   * @param token - Token that failed (object with name or string)
   * @param scopePath - Path of scopes searched
   * @param registeredTokens - List of registered token names
   */
  constructor(
    token: unknown,
    scopePath: string[] = [],
    registeredTokens: unknown[] = [],
  ) {
    const tokenName = typeof token === "object" && token !== null && "name" in token
      ? String(token.name)
      : String(token);
    const scopeStr = scopePath.length > 0 ? ` in scopes [${scopePath.join(" → ")}]` : "";
    const registeredNames = registeredTokens.map((t) =>
      typeof t === "object" && t !== null && "name" in t ? String(t.name) : String(t)
    );
    const hint = registeredNames.length > 0
      ? `\nHint: Did you forget to register "${tokenName}" in this container?`
      : "";
    super(`No binding found for token "${tokenName}"${scopeStr}${hint}`);
    this.name = "ResolutionError";
  }
}
