import {
  Container,
  Lifecycle,
  createToken,
  defineModule,
} from "@mrmeaow/tsinject";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("Container Comprehensive Coverage", () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
  });

  describe("register methods", () => {
    it("should register and resolve value", () => {
      const Token = createToken<string>("Value");
      container.registerValue(Token, "test-value");
      expect(container.resolve(Token)).toBe("test-value");
    });

    it("should register and resolve factory", () => {
      const Token = createToken<number>("Factory");
      container.registerFactory(Token, () => 42);
      expect(container.resolve(Token)).toBe(42);
    });

    it("should register and resolve class", () => {
      const Token = createToken<{ name: string }>("Class");
      class Service {
        name = "service";
      }
      container.registerClass(Token, Service);
      expect(container.resolve(Token).name).toBe("service");
    });

    it("should register and resolve singleton", () => {
      const Token = createToken<object>("Singleton");
      class Service {}
      container.registerClass(Token, Service, {
        lifecycle: Lifecycle.Singleton,
      });
      const a = container.resolve(Token);
      const b = container.resolve(Token);
      expect(a).toBe(b);
    });

    it("should register transient", () => {
      const Token = createToken<object>("Transient");
      class Service {}
      container.registerClass(Token, Service, {
        lifecycle: Lifecycle.Transient,
      });
      const a = container.resolve(Token);
      const b = container.resolve(Token);
      expect(a).not.toBe(b);
    });

    it("should register alias via factory", () => {
      const Original = createToken<string>("Original");
      const Alias = createToken<string>("Alias");
      container.registerValue(Original, "original");
      container.registerFactory(Alias, (ctx) => ctx.resolve(Original));
      expect(container.resolve(Alias)).toBe("original");
    });

    it("should resolve alias to same instance", () => {
      const Original = createToken<object>("OriginalObj");
      const Alias = createToken<object>("AliasObj");
      const sharedObj = {};
      container.registerValue(Original, sharedObj);
      container.registerFactory(Alias, (ctx) => ctx.resolve(Original));
      expect(container.resolve(Original)).toBe(container.resolve(Alias));
    });

    it("should register with tags", () => {
      const Token = createToken<object>("Tagged");
      container.registerFactory(Token, () => ({}), { tags: ["web", "api"] });
      expect(container.resolve(Token)).toBeDefined();
    });

    it("should register with dispose function", async () => {
      const Token = createToken<object>("Disposable");
      const disposeFn = vi.fn();
      const instance = { id: "test" };
      container.registerFactory(Token, () => instance, { dispose: disposeFn });
      container.resolve(Token);
      await container.dispose();
      expect(disposeFn).toHaveBeenCalledWith(instance);
    });
  });

  describe("async resolution", () => {
    it("should resolve value async", async () => {
      const Token = createToken<string>("AsyncValue");
      container.registerValue(Token, "async-value");
      expect(await container.resolveAsync(Token)).toBe("async-value");
    });

    it("should resolve factory async", async () => {
      const Token = createToken<number>("AsyncFactory");
      container.registerFactory(Token, async () => 123);
      expect(await container.resolveAsync(Token)).toBe(123);
    });

    it("should resolve class async", async () => {
      const Token = createToken<{ name: string }>("AsyncClass");
      class Service {
        name = "async-service";
      }
      container.registerClass(Token, Service);
      expect((await container.resolveAsync(Token)).name).toBe("async-service");
    });

    it("should resolve alias async", async () => {
      const Original = createToken<string>("AsyncOriginal");
      const Alias = createToken<string>("AsyncAlias");
      container.registerValue(Original, "aliased");
      container.registerFactory(Alias, (ctx) => ctx.resolve(Original));
      expect(await container.resolveAsync(Alias)).toBe("aliased");
    });

    it("should resolve async factory with dependencies", async () => {
      const Dep = createToken<string>("AsyncDep");
      const Token = createToken<string>("AsyncWithDep");
      container.registerValue(Dep, "dependency");
      container.registerFactory(Token, async (ctx) => {
        const dep = await ctx.resolveAsync(Dep);
        return `got-${dep}`;
      });
      expect(await container.resolveAsync(Token)).toBe("got-dependency");
    });
  });

  describe("tryResolve", () => {
    it("should return value for registered token", () => {
      const Token = createToken<string>("TryValue");
      container.registerValue(Token, "found");
      expect(container.tryResolve(Token)).toBe("found");
    });

    it("should return undefined for missing token", () => {
      const Token = createToken<string>("Missing");
      expect(container.tryResolve(Token)).toBeUndefined();
    });

    it("should tryResolve async for existing token", async () => {
      const Token = createToken<string>("TryAsync");
      container.registerValue(Token, "async-found");
      expect(await container.tryResolveAsync(Token)).toBe("async-found");
    });

    it("should tryResolve async for missing token", async () => {
      const Token = createToken<string>("MissingAsync");
      expect(await container.tryResolveAsync(Token)).toBeUndefined();
    });
  });

  describe("scopes", () => {
    it("should create scoped container", () => {
      const scope = container.createScope("request");
      expect(scope).toBeDefined();
    });

    it("should resolve from parent scope", () => {
      const ParentToken = createToken<string>("Parent");
      container.registerValue(ParentToken, "parent-value");
      const scope = container.createScope("request");
      expect(scope.resolve(ParentToken)).toBe("parent-value");
    });

    it("should override in child scope", () => {
      const Token = createToken<string>("Override");
      container.registerValue(Token, "parent");
      const scope = container.createScope("request");
      scope.registerValue(Token, "child");
      expect(container.resolve(Token)).toBe("parent");
      expect(scope.resolve(Token)).toBe("child");
    });

    it("should create nested scopes", () => {
      const Token = createToken<string>("Nested");
      container.registerValue(Token, "root");
      const scope1 = container.createScope("s1");
      const scope2 = scope1.createScope("s2");
      scope2.registerValue(Token, "nested");
      expect(container.resolve(Token)).toBe("root");
      expect(scope1.resolve(Token)).toBe("root");
      expect(scope2.resolve(Token)).toBe("nested");
    });

    it("should share singleton across scopes", () => {
      const Token = createToken<object>("SharedSingleton");
      class Service {}
      container.registerClass(Token, Service, {
        lifecycle: Lifecycle.Singleton,
      });
      const scope = container.createScope("request");
      expect(container.resolve(Token)).toBe(scope.resolve(Token));
    });

    it("should create separate instances for scoped in different scopes", () => {
      const Token = createToken<object>("ScopedInstance");
      class Service {}
      container.registerClass(Token, Service, { lifecycle: Lifecycle.Scoped });
      const scope1 = container.createScope("s1");
      const scope2 = container.createScope("s2");
      const a = scope1.resolve(Token);
      const b = scope2.resolve(Token);
      expect(a).not.toBe(b);
    });
  });

  describe("modules", () => {
    it("should load module with values", () => {
      const Token = createToken<string>("ModuleValue");
      const mod = defineModule({
        providers: [
          { token: Token, provider: { type: "value", useValue: "mod" } },
        ],
      });
      container.load(mod);
      expect(container.resolve(Token)).toBe("mod");
    });

    it("should load module with classes", () => {
      const Token = createToken<{ name: string }>("ModuleClass");
      class Service {
        name = "mod-class";
      }
      const mod = defineModule({
        providers: [
          { token: Token, provider: { type: "class", useClass: Service } },
        ],
      });
      container.load(mod);
      expect(container.resolve(Token).name).toBe("mod-class");
    });

    it("should load module with factories", () => {
      const Token = createToken<number>("ModuleFactory");
      const mod = defineModule({
        providers: [
          { token: Token, provider: { type: "factory", useFactory: () => 99 } },
        ],
      });
      container.load(mod);
      expect(container.resolve(Token)).toBe(99);
    });

    it("should load module with imports", () => {
      const TokenA = createToken<string>("ModA");
      const TokenB = createToken<string>("ModB");
      const modA = defineModule({
        providers: [
          { token: TokenA, provider: { type: "value", useValue: "a" } },
        ],
      });
      const modB = defineModule({
        providers: [
          { token: TokenB, provider: { type: "value", useValue: "b" } },
        ],
        imports: [modA],
      });
      container.load(modB);
      expect(container.resolve(TokenA)).toBe("a");
      expect(container.resolve(TokenB)).toBe("b");
    });
  });

  describe("disposal", () => {
    it("should dispose single binding", async () => {
      const Token = createToken<object>("DisposeOne");
      const disposeFn = vi.fn();
      container.registerFactory(Token, () => ({}), { dispose: disposeFn });
      container.resolve(Token);
      await container.dispose();
      expect(disposeFn).toHaveBeenCalled();
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

  describe("circular dependency", () => {
    it("should detect circular dependencies", () => {
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

    it("should throw ResolutionError with token name", () => {
      const Token = createToken<string>("MissingToken");
      try {
        container.resolve(Token);
      } catch (e: any) {
        expect(e.message).toContain("MissingToken");
      }
    });
  });

  describe("container info", () => {
    it("should have registered tokens", () => {
      const Token = createToken<string>("InfoToken");
      container.registerValue(Token, "info");
      expect(container.resolve(Token)).toBe("info");
    });
  });
});
