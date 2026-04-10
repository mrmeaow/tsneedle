import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  Container,
  createToken,
  Lifecycle,
} from "@mrmeaow/tsinject";

describe("Container - 90% Async Coverage", () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
  });

  describe("resolveAsync - value provider", () => {
    it("should resolve value async", async () => {
      const Token = createToken<string>("AsyncValue");
      container.registerValue(Token, "async-value");
      const result = await container.resolveAsync(Token);
      expect(result).toBe("async-value");
    });
  });

  describe("resolveAsync - factory provider", () => {
    it("should resolve sync factory via async", async () => {
      const Token = createToken<number>("SyncFactoryAsync");
      container.registerFactory(Token, () => 42);
      const result = await container.resolveAsync(Token);
      expect(result).toBe(42);
    });

    it("should resolve async factory via async", async () => {
      const Token = createToken<number>("AsyncFactory");
      container.registerFactory(Token, async () => 123);
      const result = await container.resolveAsync(Token);
      expect(result).toBe(123);
    });

    it("should resolve async factory with context dependencies", async () => {
      const Dep = createToken<string>("AsyncCtxDep");
      const Token = createToken<string>("AsyncCtx");
      container.registerValue(Dep, "ctx-dep");
      container.registerFactory(Token, async (ctx) => {
        const dep = await ctx.resolveAsync(Dep);
        return `got-${dep}`;
      });
      const result = await container.resolveAsync(Token);
      expect(result).toBe("got-ctx-dep");
    });
  });

  describe("resolveAsync - class provider", () => {
    it("should resolve class with no constructor params async", async () => {
      const Token = createToken<{ type: string }>("AsyncClassNoParams");
      class Service {
        type = "no-params";
      }
      container.registerClass(Token, Service);
      const result = await container.resolveAsync(Token);
      expect(result.type).toBe("no-params");
    });
  });

  describe("resolveAsync - alias provider", () => {
    it("should resolve alias async", async () => {
      const Original = createToken<string>("AsyncOriginal");
      const Alias = createToken<string>("AsyncAlias");
      container.registerValue(Original, "original");
      container.registerFactory(Alias, (ctx) => ctx.resolve(Original));
      const result = await container.resolveAsync(Alias);
      expect(result).toBe("original");
    });
  });

  describe("tryResolveAsync", () => {
    it("should return value for existing token", async () => {
      const Token = createToken<string>("TryAsyncExists");
      container.registerValue(Token, "found");
      const result = await container.tryResolveAsync(Token);
      expect(result).toBe("found");
    });

    it("should return undefined for missing token", async () => {
      const Token = createToken<string>("TryAsyncMissing");
      const result = await container.tryResolveAsync(Token);
      expect(result).toBeUndefined();
    });
  });

  describe("async disposal", () => {
    it("should call sync dispose", async () => {
      const Token = createToken<object>("DisposeSyncAsync");
      const disposeFn = vi.fn();
      const instance = { id: "sync" };
      container.registerFactory(Token, () => instance, { dispose: disposeFn });
      container.resolve(Token);
      await container.dispose();
      expect(disposeFn).toHaveBeenCalledWith(instance);
    });

    it("should call async dispose", async () => {
      const Token = createToken<object>("DisposeAsyncFn");
      const disposeFn = vi.fn().mockResolvedValue(undefined);
      const instance = { id: "async" };
      container.registerFactory(Token, () => instance, { dispose: disposeFn });
      container.resolve(Token);
      await container.dispose();
      expect(disposeFn).toHaveBeenCalledWith(instance);
    });

    it("should dispose multiple bindings", async () => {
      const T1 = createToken<object>("D1Async");
      const T2 = createToken<object>("D2Async");
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

    it("should throw on resolve after disposal", async () => {
      const Token = createToken<object>("AfterDisposeAsync");
      container.registerFactory(Token, () => ({}));
      await container.dispose();
      expect(() => container.resolve(Token)).toThrow();
    });
  });

  describe("circular dependency", () => {
    it("should detect circular dependencies", () => {
      const A = createToken<object>("CycleA90");
      const B = createToken<object>("CycleB90");
      container.registerFactory(A, (ctx) => ({ b: ctx.resolve(B) }));
      container.registerFactory(B, (ctx) => ({ a: ctx.resolve(A) }));
      expect(() => container.resolve(A)).toThrow();
    });
  });
});
