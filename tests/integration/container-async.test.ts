import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  Container,
  createToken,
  Lifecycle,
  defineModule,
} from "@mrmeaow/tsinject";

describe("Container - Full Async Coverage", () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
  });

  describe("resolveAsync - all provider types", () => {
    it("should resolve value provider async", async () => {
      const Token = createToken<string>("AsyncValue");
      container.registerValue(Token, "async-value");
      const result = await container.resolveAsync(Token);
      expect(result).toBe("async-value");
    });

    it("should resolve factory provider async", async () => {
      const Token = createToken<number>("AsyncFactory");
      container.registerFactory(Token, async () => 123);
      const result = await container.resolveAsync(Token);
      expect(result).toBe(123);
    });

    it("should resolve class provider async", async () => {
      const Token = createToken<{ name: string }>("AsyncClass");
      class Service {
        name = "async-class";
      }
      container.registerClass(Token, Service);
      const result = await container.resolveAsync(Token);
      expect(result.name).toBe("async-class");
    });

    it("should resolve alias provider async", async () => {
      const Original = createToken<string>("Original");
      const Alias = createToken<string>("Alias");
      container.registerValue(Original, "aliased");
      container.registerFactory(Alias, (ctx) => ctx.resolve(Original));
      const result = await container.resolveAsync(Alias);
      expect(result).toBe("aliased");
    });
  });

  describe("tryResolveAsync", () => {
    it("should return value for existing token", async () => {
      const Token = createToken<string>("TryAsync");
      container.registerValue(Token, "found");
      const result = await container.tryResolveAsync(Token);
      expect(result).toBe("found");
    });

    it("should return undefined for missing token", async () => {
      const Token = createToken<string>("MissingAsync");
      const result = await container.tryResolveAsync(Token);
      expect(result).toBeUndefined();
    });
  });

  describe("async factory with context", () => {
    it("should resolve dependencies via async context", async () => {
      const Dep = createToken<string>("AsyncDep");
      const Token = createToken<string>("AsyncWithDep");
      container.registerValue(Dep, "dep-value");
      container.registerFactory(Token, async (ctx) => {
        const dep = await ctx.resolveAsync(Dep);
        return `got-${dep}`;
      });
      const result = await container.resolveAsync(Token);
      expect(result).toBe("got-dep-value");
    });

    it("should tryResolve in async factory", async () => {
      const Missing = createToken<string>("MissingInAsync");
      const Token = createToken<string | undefined>("TryInAsync");
      container.registerFactory(Token, async (ctx) => {
        return ctx.tryResolve(Missing);
      });
      const result = await container.resolveAsync(Token);
      expect(result).toBeUndefined();
    });

    it("should tryResolveAsync in async factory", async () => {
      const Missing = createToken<string>("MissingTryAsync");
      const Token = createToken<string | undefined>("TryResolveAsync");
      container.registerFactory(Token, async (ctx) => {
        return ctx.tryResolveAsync(Missing);
      });
      const result = await container.resolveAsync(Token);
      expect(result).toBeUndefined();
    });
  });

  describe("async disposal", () => {
    it("should call sync dispose on disposal", async () => {
      const Token = createToken<object>("DisposeSync");
      const disposeFn = vi.fn();
      const instance = { id: "sync" };
      container.registerFactory(Token, () => instance, { dispose: disposeFn });
      container.resolve(Token);
      await container.dispose();
      expect(disposeFn).toHaveBeenCalledWith(instance);
    });

    it("should call async dispose on disposal", async () => {
      const Token = createToken<object>("DisposeAsync");
      const disposeFn = vi.fn().mockResolvedValue(undefined);
      const instance = { id: "async" };
      container.registerFactory(Token, () => instance, { dispose: disposeFn });
      container.resolve(Token);
      await container.dispose();
      expect(disposeFn).toHaveBeenCalledWith(instance);
    });

    it("should dispose multiple bindings", async () => {
      const T1 = createToken<object>("D1");
      const T2 = createToken<object>("D2");
      const d1 = vi.fn();
      const d2 = vi.fn();
      container.registerFactory(T1, () => ({}), { dispose: d1 });
      container.registerFactory(T2, () => ({}), { dispose: d2 });
      container.resolve(T1);
      container.resolve(T2);
      await container.dispose();
      expect(d1).toHaveBeenCalled();
      expect(d2).toHaveBeenCalled();
    });

    it("should throw when resolving after disposal", async () => {
      const Token = createToken<object>("AfterDispose");
      container.registerFactory(Token, () => ({}));
      await container.dispose();
      expect(() => container.resolve(Token)).toThrow();
    });
  });

  describe("circular dependency detection", () => {
    it("should detect circular dependencies on sync resolve", () => {
      const A = createToken<object>("CycleA");
      const B = createToken<object>("CycleB");
      container.registerFactory(A, (ctx) => ({ b: ctx.resolve(B) }));
      container.registerFactory(B, (ctx) => ({ a: ctx.resolve(A) }));
      expect(() => container.resolve(A)).toThrow();
    });
  });

  describe("error handling", () => {
    it("should throw on unregistered token", () => {
      const Token = createToken<string>("Unregistered");
      expect(() => container.resolve(Token)).toThrow();
    });
  });
});
