/**
 * Lifecycle strategy for dependency resolution.
 *
 * - `Transient`: New instance on each resolution
 * - `Singleton`: Single instance per container
 * - `Scoped`: Single instance per scope
 */
export enum Lifecycle {
  /** Create a new instance every time the token is resolved */
  Transient = "transient",
  /** Create one instance shared across the entire container */
  Singleton = "singleton",
  /** Create one instance per container scope */
  Scoped = "scoped",
}
