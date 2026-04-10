import { Lifecycle } from "../binding/lifecycle.js";
import { MetadataRegistry } from "../metadata/metadata-registry.js";
import type { Constructor } from "../utils/constructor.js";

export interface InjectableMeta {
  lifecycle: Lifecycle;
  tags: string[];
}

/**
 * Mark a class as injectable.
 *
 * Registers metadata so the container can automatically
 * resolve constructor parameters.
 *
 * @param options - Optional lifecycle and tag configuration
 *
 * @example
 * ```ts
 * @injectable({ lifecycle: Lifecycle.Singleton })
 * class MyService {
 *   constructor(@inject(LoggerToken) private logger: Logger) {}
 * }
 * ```
 */
export function injectable(options?: {
  lifecycle?: Lifecycle;
  tags?: string[];
}) {
  return <T extends Constructor<unknown>>(
    target: T,
    context: ClassDecoratorContext<T>,
  ): T => {
    const meta: InjectableMeta = {
      lifecycle: options?.lifecycle ?? Lifecycle.Transient,
      tags: options?.tags ?? [],
    };
    MetadataRegistry.registerInjectable(target, meta);
    return target;
  };
}

/**
 * Mark a class as a singleton.
 *
 * Equivalent to `@injectable({ lifecycle: Lifecycle.Singleton })`.
 *
 * @example
 * ```ts
 * @singleton()
 * class DatabaseConnection { }
 * ```
 */
export function singleton() {
  return injectable({ lifecycle: Lifecycle.Singleton });
}

/**
 * Mark a class as scoped.
 *
 * Equivalent to `@injectable({ lifecycle: Lifecycle.Scoped })`.
 *
 * @example
 * ```ts
 * @scoped()
 * class RequestContext { }
 * ```
 */
export function scoped() {
  return injectable({ lifecycle: Lifecycle.Scoped });
}
