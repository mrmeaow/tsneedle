import type { ResolutionContext } from "../context/resolution-context.js";
import type { Token } from "../token/token.js";
import type { Constructor } from "../utils/constructor.js";

/**
 * Provider that creates instances using a class constructor.
 *
 * @typeParam T - The type of instance this provider creates
 */
export interface ClassProvider<T> {
  readonly type: "class";
  /** The class constructor to instantiate */
  readonly useClass: Constructor<T>;
}

/**
 * Provider that creates instances using a factory function.
 *
 * @typeParam T - The type of instance this provider creates
 */
export interface FactoryProvider<T> {
  readonly type: "factory";
  /** Factory function that produces the instance */
  readonly useFactory: (ctx: ResolutionContext) => T | Promise<T>;
  /** Optional tokens to inject as dependencies */
  readonly inject?: readonly Token<unknown>[];
}

/**
 * Provider that returns a static value.
 *
 * @typeParam T - The type of value this provider returns
 */
export interface ValueProvider<T> {
  readonly type: "value";
  /** The static value to return */
  readonly useValue: T;
}

/**
 * Provider that delegates resolution to another token.
 *
 * @typeParam T - The type of instance this provider resolves to
 */
export interface AliasProvider<T> {
  readonly type: "alias";
  /** The token to delegate resolution to */
  readonly useToken: Token<T>;
}

/**
 * Union type of all provider strategies.
 *
 * @typeParam T - The type of instance this provider creates
 */
export type Provider<T> =
  | ClassProvider<T>
  | FactoryProvider<T>
  | ValueProvider<T>
  | AliasProvider<T>;
