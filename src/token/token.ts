/**
 * A branded token for dependency injection.
 *
 * Tokens are used as keys for registering and resolving dependencies
 * in the container. The phantom type `T` ensures compile-time type safety.
 *
 * @typeParam T - The type of value this token represents
 */
export interface Token<T> {
  /** Human-readable name for debugging */
  readonly name: string;
  /** Unique symbol key for the token */
  readonly key: symbol;
}

/**
 * Create a new injection token.
 *
 * @example
 * ```ts
 * const LoggerToken = createToken<Logger>('Logger');
 * container.registerFactory(LoggerToken, () => new ConsoleLogger());
 * ```
 *
 * @typeParam T - The type of value this token represents
 * @param name - Human-readable name for debugging
 * @returns A frozen token object
 */
export function createToken<T>(name: string): Token<T> {
  const key = Symbol(`tsinject:${name}`);
  const __token_brand: unique symbol = Symbol("tsinject/token");
  return Object.freeze({
    [__token_brand]: __token_brand,
    name,
    key,
  } as Token<T>);
}
