import { describe, expect, it, vi, beforeEach } from "vitest";
import { Container, createToken, Lifecycle, defineModule } from "@mrmeaow/tsinject";

describe("Binding & Provider Types", () => {
  describe("createBinding", () => {
    it("should create value binding", () => {
      const Token = createToken<string>("Value");
      const container = new Container();
      container.registerValue(Token, "test");
      expect(container.resolve(Token)).toBe("test");
    });

    it("should create class binding with lifecycle", () => {
      const Token = createToken<object>("Class");
      class Service {}
      const container = new Container();
      container.registerClass(Token, Service, { lifecycle: Lifecycle.Singleton });
      const a = container.resolve(Token);
      const b = container.resolve(Token);
      expect(a).toBe(b);
    });

    it("should create factory binding with context", () => {
      const Dep = createToken<string>("Dep");
      const Token = createToken<string>("Factory");
      const container = new Container();
      container.registerValue(Dep, "dep-value");
      container.registerFactory(Token, (ctx) => `got-${ctx.resolve(Dep)}`);
      expect(container.resolve(Token)).toBe("got-dep-value");
    });

    it("should create alias binding", () => {
      const Original = createToken<string>("Original");
      const Alias = createToken<string>("Alias");
      const container = new Container();
      container.registerValue(Original, "original");
      container.registerFactory(Alias, (ctx) => ctx.resolve(Original));
      expect(container.resolve(Alias)).toBe("original");
      expect(container.resolve(Original)).toBe(container.resolve(Alias));
    });

    it("should register with tags", () => {
      const Token = createToken<object>("Tagged");
      const container = new Container();
      container.registerFactory(Token, () => ({}), { tags: ["web", "api"] });
      expect(container.resolve(Token)).toBeDefined();
    });

    it("should register with dispose callback", async () => {
      const Token = createToken<object>("Disposable");
      const disposeFn = vi.fn();
      const instance = { id: "test" };
      const container = new Container();
      container.registerFactory(Token, () => instance, { dispose: disposeFn });
      container.resolve(Token);
      await container.dispose();
      expect(disposeFn).toHaveBeenCalledWith(instance);
    });
  });
});
