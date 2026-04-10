import type { Lifecycle } from "./lifecycle.js";

/**
 * Options for registering a dependency.
 *
 * @property lifecycle - How instances should be cached
 * @property tags - Optional metadata tags for filtering
 * @property dispose - Cleanup function called when container is disposed
 */
export interface RegisterOptions {
  /** Instance lifecycle strategy (default: Transient) */
  readonly lifecycle?: Lifecycle;
  /** Arbitrary metadata tags for categorization */
  readonly tags?: readonly string[];
  /** Cleanup function called during container disposal */
  readonly dispose?: (instance: unknown) => Promise<void> | void;
}
