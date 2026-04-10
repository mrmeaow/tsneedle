import { type Binding, createBinding } from "../binding/binding.js";
import { Lifecycle } from "../binding/lifecycle.js";
import type {
  AliasProvider,
  ClassProvider,
  FactoryProvider,
  Provider,
  ValueProvider,
} from "../binding/provider.js";
import type { RegisterOptions } from "../binding/register-options.js";
import type { ResolutionContext } from "../context/resolution-context.js";
import { createResolutionContext } from "../context/resolution-context.js";
import { AsyncFactoryError } from "../errors/async-factory-error.js";
import { CircularDependencyError } from "../errors/circular-dependency-error.js";
import { DisposedContainerError } from "../errors/disposed-container-error.js";
import { ResolutionError } from "../errors/resolution-error.js";
import { MetadataRegistry } from "../metadata/metadata-registry.js";
import type { ModuleDefinition } from "../modules/module.js";
import { type Token, createToken } from "../token/token.js";
import type { Constructor } from "../utils/constructor.js";

export class Container {
  private readonly registry: Map<symbol, Binding<unknown>> = new Map();
  private readonly cache: Map<symbol, unknown> = new Map();
  private readonly parent: Container | null = null;
  private readonly scopeName: string | null = null;
  private readonly scopes: Map<string, Container> = new Map();
  private readonly disposalStack: Array<{
    token: Token<unknown>;
    instance: { constructor: Constructor<unknown> };
    dispose?: (instance: unknown) => Promise<void> | void;
  }> = [];
  private _disposed = false;
  private resolutionStack: Token<unknown>[] = [];

  constructor(parent?: Container, scopeName?: string) {
    this.parent = parent ?? null;
    this.scopeName = scopeName ?? null;
  }

  register<T>(
    token: Token<T>,
    provider: Provider<T>,
    options?: RegisterOptions,
  ): void {
    const binding = createBinding(token, provider, options);
    this.registry.set(token.key, binding as Binding<unknown>);
  }

  registerClass<T>(
    token: Token<T>,
    cls: Constructor<T>,
    options?: RegisterOptions,
  ): void {
    this.register(token, { type: "class", useClass: cls }, options);
  }

  registerFactory<T>(
    token: Token<T>,
    factory: (ctx: ResolutionContext) => T | Promise<T>,
    options?: RegisterOptions,
  ): void {
    this.register(token, { type: "factory", useFactory: factory }, options);
  }

  registerSingleton<T>(token: Token<T>, cls: Constructor<T>): void {
    this.registerClass(token, cls, { lifecycle: Lifecycle.Singleton });
  }

  registerValue<T>(token: Token<T>, value: T): void {
    this.register(token, { type: "value", useValue: value });
  }

  resolve<T>(token: Token<T>): T {
    if (this._disposed) {
      throw new DisposedContainerError();
    }

    // Check cache first
    const cached = this.getFromCache(token);
    if (cached !== undefined) {
      return cached as T;
    }

    // Find binding
    const binding = this.getBinding(token);
    if (!binding) {
      const registered = this.getRegisteredTokenNames();
      throw new ResolutionError(token, this.getScopePath(), registered as unknown[]);
    }

    // Check circular dependency
    if (this.resolutionStack.includes(token)) {
      throw new CircularDependencyError(token, [...this.resolutionStack]);
    }

    // Check if factory is async - can't use sync resolve for async factories
    if (binding.provider.type === "factory") {
      const factoryProvider = binding.provider as FactoryProvider<T>;
      const result = factoryProvider.useFactory(
        createResolutionContext(this) as ResolutionContext,
      );
      if (result instanceof Promise) {
        throw new AsyncFactoryError(token);
      }
    }

    // Push to resolution stack
    this.resolutionStack.push(token);

    try {
      // Resolve the instance
      const instance = this.resolveBinding(binding, token);

      // Cache based on lifecycle
      if (binding.lifecycle === Lifecycle.Singleton) {
        this.getRootCache().set(token.key, instance);
      } else if (binding.lifecycle === Lifecycle.Scoped) {
        this.cache.set(token.key, instance);
      }

      // Register for disposal if needed
      const preDestroyClass =
        binding.provider.type === "class"
          ? (binding.provider as ClassProvider<T>).useClass
          : undefined;
      const preDestroyMethod = preDestroyClass
        ? MetadataRegistry.getPreDestroy(
            preDestroyClass as Constructor<unknown>,
          )
        : undefined;

      if (binding.dispose || preDestroyMethod) {
        const entry: {
          token: Token<unknown>;
          instance: { constructor: Constructor<unknown> };
          dispose?: (instance: unknown) => void | Promise<void>;
        } = {
          token,
          instance: instance as { constructor: Constructor<unknown> },
        };
        if (binding.dispose) {
          entry.dispose = binding.dispose;
        }
        this.disposalStack.push(entry);
      }

      return instance as T;
    } finally {
      this.resolutionStack.pop();
    }
  }

  resolveAsync<T>(token: Token<T>): Promise<T> {
    if (this._disposed) {
      throw new DisposedContainerError();
    }

    // Check cache first (singleton/scoped)
    const cached = this.getFromCache(token);
    if (cached !== undefined) {
      return Promise.resolve(cached as T);
    }

    // Find binding
    const binding = this.getBinding(token);
    if (!binding) {
      const registered = this.getRegisteredTokenNames();
      throw new ResolutionError(token, this.getScopePath(), registered as unknown[]);
    }

    // Check circular dependency
    if (this.resolutionStack.includes(token)) {
      throw new CircularDependencyError(token, [...this.resolutionStack]);
    }

    // Push to resolution stack
    this.resolutionStack.push(token);

    return (async () => {
      try {
        // Resolve the instance (handles both sync and async)
        const instance = await this.resolveBindingAsync(binding, token);

        // Cache based on lifecycle
        if (binding.lifecycle === Lifecycle.Singleton) {
          this.getRootCache().set(token.key, instance);
        } else if (binding.lifecycle === Lifecycle.Scoped) {
          this.cache.set(token.key, instance);
        }

        // Register for disposal
        const preDestroyClass =
          binding.provider.type === "class"
            ? (binding.provider as ClassProvider<T>).useClass
            : undefined;
        const preDestroyMethod = preDestroyClass
          ? MetadataRegistry.getPreDestroy(
              preDestroyClass as Constructor<unknown>,
            )
          : undefined;

        if (binding.dispose || preDestroyMethod) {
          const entry: {
            token: Token<unknown>;
            instance: { constructor: Constructor<unknown> };
            dispose?: (instance: unknown) => void | Promise<void>;
          } = {
            token,
            instance: instance as { constructor: Constructor<unknown> },
          };
          if (binding.dispose) {
            entry.dispose = binding.dispose;
          }
          this.disposalStack.push(entry);
        }

        return instance as T;
      } finally {
        this.resolutionStack.pop();
      }
    })();
  }

  tryResolve<T>(token: Token<T>): T | undefined {
    try {
      if (!this.has(token)) {
        return undefined;
      }
      return this.resolve(token);
    } catch {
      return undefined;
    }
  }

  has(token: Token<unknown>): boolean {
    if (this.registry.has(token.key)) {
      return true;
    }
    if (this.parent) {
      return this.parent.has(token);
    }
    return false;
  }

  hasAsync(token: Token<unknown>): boolean {
    return this.has(token);
  }

  createScope(name: string): Container {
    const scope = new Container(this, name);
    this.scopes.set(name, scope);
    return scope;
  }

  load(module: ModuleDefinition): void {
    // Recursively load imported modules first
    for (const imported of module.imports ?? []) {
      this.load(imported);
    }

    // Register all providers from this module
    for (const registration of module.providers) {
      this.register(
        registration.token,
        registration.provider,
        registration as RegisterOptions,
      );
    }
  }

  async dispose(): Promise<void> {
    if (this._disposed) return;
    this._disposed = true;

    // Dispose in reverse order
    for (const entry of [...this.disposalStack].reverse()) {
      try {
        const instanceAny = entry.instance as Record<string, unknown>;
        const preDestroyMethod = MetadataRegistry.getPreDestroy(
          entry.instance.constructor as Constructor<unknown>,
        );

        if (preDestroyMethod) {
          const methodName = preDestroyMethod as string;
          if (typeof instanceAny[methodName] === "function") {
            const result = instanceAny[methodName]();
            if (result instanceof Promise) {
              await result;
            }
          }
        }

        if (entry.dispose) {
          await entry.dispose(entry.instance);
        }
      } catch (err: unknown) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (globalThis as any).console?.error(
          `tsinject: Error disposing "${entry.token.name}": ${err}`,
        );
      }
    }

    // Dispose child scopes
    for (const child of this.scopes.values()) {
      await child.dispose();
    }

    this.registry.clear();
    this.cache.clear();
    this.disposalStack.length = 0;
  }

  get isDisposed(): boolean {
    return this._disposed;
  }

  get parentContainer(): Container | null {
    return this.parent;
  }

  // Private helper methods
  private getBinding(token: Token<unknown>): Binding<unknown> | undefined {
    if (this.registry.has(token.key)) {
      return this.registry.get(token.key);
    }
    if (this.parent) {
      return this.parent.getBinding(token);
    }
    return undefined;
  }

  private getFromCache(token: Token<unknown>): unknown {
    // Check scope cache first
    if (this.cache.has(token.key)) {
      return this.cache.get(token.key);
    }
    // Check root cache for singletons
    if (this.parent) {
      return this.parent.getFromCache(token);
    }
    // Root container checks its own cache
    return this.cache.get(token.key);
  }

  private getRootCache(): Map<symbol, unknown> {
    if (this.parent) {
      return this.parent.getRootCache();
    }
    return this.cache;
  }

  private resolveBinding<T>(binding: Binding<unknown>, token: Token<T>): T {
    const provider = binding.provider;

    switch (provider.type) {
      case "value":
        return this.resolveValue(provider as ValueProvider<T>);

      case "alias":
        return this.resolveAlias(provider as AliasProvider<T>);

      case "class":
        return this.resolveClass(provider as ClassProvider<T>, token);

      case "factory":
        return this.resolveFactory(provider as FactoryProvider<T>);

      default:
        throw new Error(
          `Unknown provider type: ${(provider as Provider<T>).type}`,
        );
    }
  }

  private resolveValue<T>(provider: ValueProvider<T>): T {
    return provider.useValue;
  }

  private resolveAlias<T>(provider: AliasProvider<T>): T {
    return this.resolve(provider.useToken);
  }

  private resolveClass<T>(provider: ClassProvider<T>, token: Token<T>): T {
    const Ctor = provider.useClass;
    let paramTokens = MetadataRegistry.getParamTokens(Ctor);
    const optionalParams = MetadataRegistry.getOptionalParams(Ctor);
    const paramValues: unknown[] = [];

    // Fallback to reflect-metadata if enabled and no explicit tokens
    if (paramTokens.size === 0 && MetadataRegistry.isReflectMode()) {
      paramTokens = this.getReflectParamTokens(Ctor);
    }

    // Get constructor parameter count
    const paramCount = paramTokens.size || 0;

    for (let i = 0; i < paramCount; i++) {
      const paramToken = paramTokens.get(i);
      if (paramToken) {
        let resolvedToken: Token<unknown> | null = null;

        if (MetadataRegistry.isReflectMode()) {
          resolvedToken = this.resolveReflectToken(paramToken);
        } else if (typeof paramToken === "object" && paramToken !== null) {
          resolvedToken = paramToken as Token<unknown>;
        }

        if (resolvedToken) {
          if (optionalParams.has(i)) {
            paramValues.push(this.tryResolve(resolvedToken));
          } else {
            paramValues.push(this.resolve(resolvedToken));
          }
        }
      }
    }

    // Construct instance
    const instance = new Ctor(...paramValues);

    // Property injection
    const propInjections = MetadataRegistry.getPropertyInjections(Ctor);
    for (const [prop, propToken] of propInjections) {
      (instance as Record<string, unknown>)[prop as string] = this.resolve(
        propToken as Token<unknown>,
      );
    }

    // Call postConstruct if present
    const postConstructMethod = MetadataRegistry.getPostConstruct(Ctor);
    if (postConstructMethod) {
      const instanceAny = instance as Record<string, unknown>;
      const methodKey = postConstructMethod as string;
      if (typeof instanceAny[methodKey] === "function") {
        instanceAny[methodKey]();
      }
    }

    return instance;
  }

  private resolveFactory<T>(provider: FactoryProvider<T>): T {
    const ctx = createResolutionContext(this);
    return provider.useFactory(ctx as ResolutionContext) as T;
  }

  private getReflectParamTokens(
    Ctor: Constructor<unknown>,
  ): Map<number, unknown> {
    const tokens = new Map<number, unknown>();
    const reflect = Reflect as unknown as {
      getMetadata?: (key: string, target: unknown) => unknown;
    };
    const getMetadata = reflect.getMetadata;
    if (!getMetadata) return tokens;

    const paramTypes = getMetadata("design:paramtypes", Ctor);

    if (Array.isArray(paramTypes)) {
      paramTypes.forEach((token, index) => {
        if (token && typeof token === "function") {
          tokens.set(index, token);
        }
      });
    }

    return tokens;
  }

  private resolveReflectToken(param: unknown): Token<unknown> | null {
    if (typeof param === "function") {
      const cls = param as Constructor<unknown>;
      const token = createToken(cls.name || "unknown");
      if (this.has(token)) {
        return token;
      }
    }
    return null;
  }

  private getScopePath(): string[] {
    const path: string[] = [];
    let current: Container | null = this;
    while (current) {
      if (current.scopeName) {
        path.unshift(current.scopeName);
      }
      current = current.parent;
    }
    return path;
  }

  private getRegisteredTokenNames(): string[] {
    const names: string[] = [];
    for (const binding of this.registry.values()) {
      names.push(binding.token.name);
    }
    return names;
  }

  // Async resolution helpers
  private async resolveBindingAsync<T>(
    binding: Binding<unknown>,
    token: Token<T>,
  ): Promise<T> {
    const provider = binding.provider;

    switch (provider.type) {
      case "value":
        return this.resolveValue(provider as ValueProvider<T>);

      case "alias":
        return this.resolveAliasAsync(provider as AliasProvider<T>);

      case "class":
        return this.resolveClassAsync(provider as ClassProvider<T>, token);

      case "factory":
        return this.resolveFactoryAsync(provider as FactoryProvider<T>);

      default:
        throw new Error(
          `Unknown provider type: ${(provider as Provider<T>).type}`,
        );
    }
  }

  private async resolveValueAsync<T>(provider: ValueProvider<T>): Promise<T> {
    return provider.useValue;
  }

  private async resolveAliasAsync<T>(provider: AliasProvider<T>): Promise<T> {
    return this.resolveAsync(provider.useToken);
  }

  private async resolveClassAsync<T>(
    provider: ClassProvider<T>,
    token: Token<T>,
  ): Promise<T> {
    const Ctor = provider.useClass;
    let paramTokens = MetadataRegistry.getParamTokens(Ctor);
    const optionalParams = MetadataRegistry.getOptionalParams(Ctor);
    const paramValues: unknown[] = [];

    if (paramTokens.size === 0 && MetadataRegistry.isReflectMode()) {
      paramTokens = this.getReflectParamTokens(Ctor);
    }

    const paramCount = paramTokens.size || 0;

    for (let i = 0; i < paramCount; i++) {
      const paramToken = paramTokens.get(i);
      if (paramToken) {
        let resolvedToken: Token<unknown> | null = null;

        if (MetadataRegistry.isReflectMode()) {
          resolvedToken = this.resolveReflectToken(paramToken);
        } else if (typeof paramToken === "object" && paramToken !== null) {
          resolvedToken = paramToken as Token<unknown>;
        }

        if (resolvedToken) {
          if (optionalParams.has(i)) {
            paramValues.push(this.tryResolveAsync(resolvedToken));
          } else {
            paramValues.push(this.resolveAsync(resolvedToken));
          }
        }
      }
    }

    // Resolve all params in parallel
    const resolvedParams = await Promise.all(paramValues);

    // Construct instance
    const instance = new Ctor(...resolvedParams);

    // Property injection
    const propInjections = MetadataRegistry.getPropertyInjections(Ctor);
    for (const [prop, propToken] of propInjections) {
      const resolved = await this.resolveAsync(propToken as Token<unknown>);
      (instance as Record<string, unknown>)[prop as string] = resolved;
    }

    // Call postConstruct if present (can be async)
    const postConstructMethod = MetadataRegistry.getPostConstruct(Ctor);
    if (postConstructMethod) {
      const instanceAny = instance as Record<string, unknown>;
      const methodKey = postConstructMethod as string;
      if (typeof instanceAny[methodKey] === "function") {
        const result = instanceAny[methodKey]();
        if (result instanceof Promise) {
          await result;
        }
      }
    }

    return instance;
  }

  private async resolveFactoryAsync<T>(
    provider: FactoryProvider<T>,
  ): Promise<T> {
    const ctx = createResolutionContext(this);
    const result = await provider.useFactory(ctx as ResolutionContext);
    return result as T;
  }

  tryResolveAsync<T>(token: Token<T>): Promise<T | undefined> {
    try {
      return this.resolveAsync(token);
    } catch {
      return Promise.resolve(undefined);
    }
  }
}
