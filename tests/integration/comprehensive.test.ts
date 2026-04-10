import {
  Container,
  Lifecycle,
  createToken,
  defineModule,
} from "@mrmeaow/tsinject";
import { describe, expect, it, vi } from "vitest";

describe("Comprehensive Coverage Tests", () => {
  describe("Container - Async Resolution", () => {
    it("should resolve value provider async", async () => {
      const Token = createToken<string>("ValueAsync");
      const container = new Container();
      container.registerValue(Token, "async-value");

      const result = await container.resolveAsync(Token);
      expect(result).toBe("async-value");
    });

    it("should resolve alias provider async", async () => {
      const OriginalToken = createToken<string>("OriginalAsync");
      const AliasToken = createToken<string>("AliasAsync");
      const container = new Container();
      container.registerValue(OriginalToken, "aliased");
      container.registerFactory(AliasToken, (ctx) =>
        ctx.resolve(OriginalToken),
      );

      const result = await container.resolveAsync(AliasToken);
      expect(result).toBe("aliased");
    });

    it("should resolve class provider async", async () => {
      const Token = createToken<{ name: string }>("ClassAsync");
      class Service {
        name = "async-service";
      }

      const container = new Container();
      container.registerClass(Token, Service);

      const result = await container.resolveAsync(Token);
      expect(result.name).toBe("async-service");
    });

    it("should resolve factory provider async", async () => {
      const Token = createToken<number>("FactoryAsync");
      const container = new Container();
      container.registerFactory(Token, async () => 123);

      const result = await container.resolveAsync(Token);
      expect(result).toBe(123);
    });

    it("should tryResolveAsync for existing token", async () => {
      const Token = createToken<string>("TryResolveAsync");
      const container = new Container();
      container.registerValue(Token, "found");

      const result = await container.tryResolveAsync(Token);
      expect(result).toBe("found");
    });

    it("should tryResolveAsync for missing token", async () => {
      const Token = createToken<string>("TryResolveAsyncMissing");
      const container = new Container();

      const result = await container.tryResolveAsync(Token);
      expect(result).toBeUndefined();
    });

    it("should handle async factory with context", async () => {
      const DepToken = createToken<string>("DepCtx");
      const Token = createToken<string>("FactoryCtx");
      const container = new Container();
      container.registerValue(DepToken, "ctx-dep");
      container.registerFactory(Token, async (ctx) => {
        const dep = await ctx.resolveAsync(DepToken);
        return `ctx-${dep}`;
      });

      const result = await container.resolveAsync(Token);
      expect(result).toBe("ctx-ctx-dep");
    });
  });

  describe("Container - Disposal", () => {
    it("should call sync dispose on disposal", async () => {
      const Token = createToken<object>("DisposeSync");
      const disposeFn = vi.fn();
      const instance = { id: "sync" };

      const container = new Container();
      container.registerFactory(Token, () => instance, { dispose: disposeFn });

      container.resolve(Token);
      await container.dispose();

      expect(disposeFn).toHaveBeenCalledWith(instance);
    });

    it("should call async dispose on disposal", async () => {
      const Token = createToken<object>("DisposeAsync");
      const disposeFn = vi.fn().mockResolvedValue(undefined);
      const instance = { id: "async" };

      const container = new Container();
      container.registerFactory(Token, () => instance, { dispose: disposeFn });

      container.resolve(Token);
      await container.dispose();

      expect(disposeFn).toHaveBeenCalledWith(instance);
    });

    it("should dispose multiple bindings", async () => {
      const Token1 = createToken<object>("Dispose1");
      const Token2 = createToken<object>("Dispose2");
      const dispose1 = vi.fn();
      const dispose2 = vi.fn();

      const container = new Container();
      container.registerFactory(Token1, () => ({}), { dispose: dispose1 });
      container.registerFactory(Token2, () => ({}), { dispose: dispose2 });

      container.resolve(Token1);
      container.resolve(Token2);
      await container.dispose();

      expect(dispose1).toHaveBeenCalled();
      expect(dispose2).toHaveBeenCalled();
    });
  });

  describe("Lifecycle Patterns", () => {
    it("should use singleton pattern via lifecycle", () => {
      const Token = createToken<object>("SingletonPattern");
      class Service {}

      const container = new Container();
      container.registerClass(Token, Service, {
        lifecycle: Lifecycle.Singleton,
      });

      const i1 = container.resolve(Token);
      const i2 = container.resolve(Token);
      expect(i1).toBe(i2);
    });

    it("should use scoped pattern via lifecycle", () => {
      const Token = createToken<object>("ScopedPattern");
      class Service {}

      const container = new Container();
      container.registerClass(Token, Service, {
        lifecycle: Lifecycle.Scoped,
      });

      const scope = container.createScope("test");
      const i1 = scope.resolve(Token);
      const i2 = scope.resolve(Token);
      expect(i1).toBe(i2);
    });

    it("should use transient pattern via lifecycle", () => {
      const Token = createToken<object>("TransientPattern");
      class Service {}

      const container = new Container();
      container.registerClass(Token, Service, {
        lifecycle: Lifecycle.Transient,
      });

      const i1 = container.resolve(Token);
      const i2 = container.resolve(Token);
      expect(i1).not.toBe(i2);
    });
  });

  describe("Factory Patterns", () => {
    it("should handle optional via factory", () => {
      const OptToken = createToken<string>("OptionalFactory");
      const Token = createToken<{ opt?: string }>("OptionalViaFactory");

      const container = new Container();
      container.registerFactory(Token, (ctx) => {
        const opt = ctx.tryResolve(OptToken);
        return { opt: opt ?? undefined };
      });

      const instance = container.resolve(Token);
      expect(instance.opt).toBeUndefined();
    });

    it("should handle lazy via factory", () => {
      const Token = createToken<{ value: number }>("LazyFactory");
      const ConsumerToken = createToken<{ getValue(): number }>("LazyConsumer");

      const container = new Container();
      container.registerFactory(Token, () => ({ value: 42 }));
      container.registerFactory(ConsumerToken, (ctx) => {
        let cached: { value: number } | undefined;
        return {
          getValue: () => {
            if (!cached) cached = ctx.resolve(Token);
            return cached.value;
          },
        };
      });

      const consumer = container.resolve(ConsumerToken);
      expect(consumer.getValue()).toBe(42);
    });

    it("should handle postConstruct via factory", () => {
      const Token = createToken<{ initialized: boolean }>(
        "PostConstructFactory",
      );

      const container = new Container();
      container.registerFactory(Token, () => {
        const instance = { initialized: false };
        instance.initialized = true; // Simulate postConstruct
        return instance;
      });

      const instance = container.resolve(Token);
      expect(instance.initialized).toBe(true);
    });

    it("should handle async postConstruct via factory", async () => {
      const Token = createToken<{ data: string }>("AsyncPostConstructFactory");

      const container = new Container();
      container.registerFactory(Token, async () => {
        const instance = { data: "" };
        await Promise.resolve();
        instance.data = "async-init";
        return instance;
      });

      const instance = await container.resolveAsync(Token);
      expect(instance.data).toBe("async-init");
    });

    it("should handle preDestroy via dispose", async () => {
      const Token = createToken<{ disposed: boolean }>("PreDestroyFactory");
      const disposeFn = vi.fn((instance: any) => {
        instance.disposed = true;
      });

      const container = new Container();
      container.registerFactory(Token, () => ({ disposed: false }), {
        dispose: disposeFn,
      });

      const instance = container.resolve(Token);
      expect(instance.disposed).toBe(false);
      await container.dispose();
      expect(disposeFn).toHaveBeenCalled();
    });
  });

  describe("Modules - Integration", () => {
    it("should load module with providers", () => {
      const TokenA = createToken<string>("ModuleA");
      const TokenB = createToken<number>("ModuleB");

      const module = defineModule({
        providers: [
          { token: TokenA, provider: { type: "value", useValue: "module-a" } },
          { token: TokenB, provider: { type: "value", useValue: 42 } },
        ],
      });

      const container = new Container();
      container.load(module);

      expect(container.resolve(TokenA)).toBe("module-a");
      expect(container.resolve(TokenB)).toBe(42);
    });

    it("should load module with imports", () => {
      const TokenA = createToken<string>("ImportA");
      const TokenB = createToken<string>("ImportB");

      const moduleA = defineModule({
        providers: [
          {
            token: TokenA,
            provider: { type: "value", useValue: "imported-a" },
          },
        ],
      });

      const moduleB = defineModule({
        providers: [
          {
            token: TokenB,
            provider: { type: "value", useValue: "imported-b" },
          },
        ],
        imports: [moduleA],
      });

      const container = new Container();
      container.load(moduleB);

      expect(container.resolve(TokenA)).toBe("imported-a");
      expect(container.resolve(TokenB)).toBe("imported-b");
    });
  });

  describe("Edge Cases", () => {
    it("should handle nested async resolution", async () => {
      const TokenA = createToken<string>("NestedA");
      const TokenB = createToken<string>("NestedB");

      const container = new Container();
      container.registerValue(TokenA, "nested-a");
      container.registerFactory(TokenB, async (ctx) => {
        const a = await ctx.resolveAsync(TokenA);
        return `nested-b-with-${a}`;
      });

      const result = await container.resolveAsync(TokenB);
      expect(result).toBe("nested-b-with-nested-a");
    });

    it("should handle circular dependency detection", () => {
      const TokenA = createToken<object>("CircularA");
      const TokenB = createToken<object>("CircularB");

      const container = new Container();
      container.registerFactory(TokenA, (ctx) => ({ b: ctx.resolve(TokenB) }));
      container.registerFactory(TokenB, (ctx) => ({ a: ctx.resolve(TokenA) }));

      expect(() => container.resolve(TokenA)).toThrow();
    });

    it("should support tags in registration options", () => {
      const Token = createToken<object>("TagsTest");
      const container = new Container();
      container.registerFactory(Token, () => ({}), {
        tags: ["web", "api", "v2"],
      });

      const instance = container.resolve(Token);
      expect(instance).toBeDefined();
    });

    it("should handle missing optional params via tryResolve", () => {
      const OptToken = createToken<string>("MissingOpt");
      const Token = createToken<{ opt?: string }>("MissingOptTest");

      const container = new Container();
      container.registerFactory(Token, (ctx) => ({
        opt: ctx.tryResolve(OptToken) ?? undefined,
      }));

      const instance = container.resolve(Token);
      expect(instance.opt).toBeUndefined();
    });
  });
});
