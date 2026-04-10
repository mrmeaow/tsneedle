import {
  Container,
  Lifecycle,
  createToken,
  inject,
  injectable,
  optional,
  postConstruct,
} from "@mrmeaow/tsinject";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("Container - Deep Coverage", () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
  });

  describe("async class resolution with dependencies", () => {
    it("should resolve class with factory injection async", async () => {
      const DepToken = createToken<string>("DepForClass");
      const Token = createToken<{ dep: string }>("ClassWithDepAsync");

      class Service {
        constructor(public readonly dep: string) {}
      }

      container.registerValue(DepToken, "async-dep");
      container.registerFactory(Token, async (ctx) => {
        const dep = await ctx.resolveAsync(DepToken);
        return new Service(dep);
      });

      const result = await container.resolveAsync(Token);
      expect(result.dep).toBe("async-dep");
    });
  });

  describe("async singleton caching", () => {
    it("should cache singleton on async resolve", async () => {
      const Token = createToken<object>("AsyncSingleton");
      class Service {}
      container.registerClass(Token, Service, {
        lifecycle: Lifecycle.Singleton,
      });

      const a = await container.resolveAsync(Token);
      const b = await container.resolveAsync(Token);
      expect(a).toBe(b);
    });

    it("should cache scoped on async resolve", async () => {
      const Token = createToken<object>("AsyncScoped");
      class Service {}
      container.registerClass(Token, Service, { lifecycle: Lifecycle.Scoped });

      const scope = container.createScope("req");
      const a = await scope.resolveAsync(Token);
      const b = await scope.resolveAsync(Token);
      expect(a).toBe(b);
    });
  });

  describe("async alias resolution", () => {
    it("should resolve alias async through factory", async () => {
      const Original = createToken<string>("AsyncOrig");
      const Alias = createToken<string>("AsyncAlias");
      container.registerValue(Original, "orig");
      container.registerFactory(Alias, (ctx) => ctx.resolve(Original));
      const result = await container.resolveAsync(Alias);
      expect(result).toBe("orig");
    });
  });

  describe("async factory with tryResolve", () => {
    it("should tryResolve missing token in async factory", async () => {
      const Missing = createToken<string>("MissingInAsync");
      const Token = createToken<string | undefined>("TryMissingAsync");
      container.registerFactory(Token, async (ctx) => {
        return ctx.tryResolve(Missing);
      });
      const result = await container.resolveAsync(Token);
      expect(result).toBeUndefined();
    });

    it("should tryResolveAsync missing token in async factory", async () => {
      const Missing = createToken<string>("MissingTryAsync");
      const Token = createToken<string | undefined>("TryMissingAsync2");
      container.registerFactory(Token, async (ctx) => {
        return ctx.tryResolveAsync(Missing);
      });
      const result = await container.resolveAsync(Token);
      expect(result).toBeUndefined();
    });
  });

  describe("disposal with preDestroy", () => {
    it("should register for disposal with dispose callback", async () => {
      const Token = createToken<object>("PreDestroyAsync");
      const disposeFn = vi.fn();
      container.registerFactory(Token, () => ({}), { dispose: disposeFn });
      container.resolve(Token);
      await container.dispose();
      expect(disposeFn).toHaveBeenCalled();
    });
  });

  describe("tryResolveAsync", () => {
    it("should return value for existing token", async () => {
      const Token = createToken<string>("TryExists");
      container.registerValue(Token, "exists");
      const result = await container.tryResolveAsync(Token);
      expect(result).toBe("exists");
    });

    it("should return undefined for missing token", async () => {
      const Token = createToken<string>("TryMissing");
      const result = await container.tryResolveAsync(Token);
      expect(result).toBeUndefined();
    });
  });

  describe("circular dependency", () => {
    it("should detect circular deps", () => {
      const A = createToken<object>("CycleA");
      const B = createToken<object>("CycleB");
      container.registerFactory(A, (ctx) => ({ b: ctx.resolve(B) }));
      container.registerFactory(B, (ctx) => ({ a: ctx.resolve(A) }));
      expect(() => container.resolve(A)).toThrow();
    });
  });

  describe("error on unregistered", () => {
    it("should throw ResolutionError", () => {
      const Token = createToken<string>("Unreg");
      expect(() => container.resolve(Token)).toThrow();
    });
  });

  describe("async resolution all types", () => {
    it("should resolve value async", async () => {
      const Token = createToken<string>("ValAsync");
      container.registerValue(Token, "val");
      expect(await container.resolveAsync(Token)).toBe("val");
    });

    it("should resolve factory async", async () => {
      const Token = createToken<number>("FactAsync");
      container.registerFactory(Token, async () => 99);
      expect(await container.resolveAsync(Token)).toBe(99);
    });

    it("should resolve class async", async () => {
      const Token = createToken<{ name: string }>("ClsAsync");
      class S {
        name = "cls";
      }
      container.registerClass(Token, S);
      expect((await container.resolveAsync(Token)).name).toBe("cls");
    });
  });
});
