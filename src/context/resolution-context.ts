import type { Container } from "../container/container.js";
import type { Token } from "../token/token.js";

/**
 * Context passed to factory functions for dependency resolution.
 *
 * Provides access to the container's resolution methods
 * so factories can resolve their own dependencies.
 */
export interface ResolutionContext {
  /** Resolve a token synchronously */
  resolve<T>(token: Token<T>): T;
  /** Resolve a token asynchronously */
  resolveAsync<T>(token: Token<T>): Promise<T>;
  /** Try to resolve a token, returning undefined if not found */
  tryResolve<T>(token: Token<T>): T | undefined;
  /** Try to resolve a token asynchronously, returning undefined if not found */
  tryResolveAsync<T>(token: Token<T>): Promise<T | undefined>;
  /** The root container */
  readonly container: Container;
  /** The current scope container */
  readonly scope: Container;
  /** Tags associated with the current resolution */
  readonly tags: ReadonlySet<string>;
}

/**
 * Create a resolution context from a container.
 *
 * @param container - The container to wrap
 * @returns A resolution context instance
 */
export function createResolutionContext(
  container: Container,
): ResolutionContext {
  return {
    resolve: <T>(token: Token<T>): T => container.resolve(token),
    resolveAsync: <T>(token: Token<T>): Promise<T> =>
      container.resolveAsync(token),
    tryResolve: <T>(token: Token<T>): T | undefined =>
      container.tryResolve(token),
    tryResolveAsync: <T>(token: Token<T>): Promise<T | undefined> =>
      container.tryResolveAsync(token),
    container,
    scope: container,
    tags: new Set(),
  };
}
