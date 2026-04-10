import {
  Container,
  type ResolutionContext,
  createToken,
} from "@mrmeaow/tsinject";
import { describe, expect, it, vi } from "vitest";

describe("Resolution Context", () => {
  describe("Context in factories", () => {
    it("should receive context in factory function", () => {
      const container = new Container();
      const DepToken = createToken<string>("Dep");
      const Token = createToken<string>("Main");

      let receivedCtx: ResolutionContext | undefined;
      container.registerValue(DepToken, "dependency");
      container.registerFactory(Token, (ctx) => {
        receivedCtx = ctx;
        const dep = ctx.resolve(DepToken);
        return `got-${dep}`;
      });

      const result = container.resolve(Token);
      expect(result).toBe("got-dependency");
      expect(receivedCtx).toBeDefined();
      expect(receivedCtx!.container).toBe(container);
    });

    it("should support async context resolution", async () => {
      const container = new Container();
      const DepToken = createToken<string>("Dep");
      const Token = createToken<string>("Main");

      container.registerValue(DepToken, "async-dep");
      container.registerFactory(Token, async (ctx) => {
        const dep = await ctx.resolveAsync(DepToken);
        return `async-${dep}`;
      });

      const result = await container.resolveAsync(Token);
      expect(result).toBe("async-async-dep");
    });

    it("should provide tryResolve for existing tokens", () => {
      const container = new Container();
      const Token = createToken<string>("Existing");
      const FactoryToken = createToken<void>("Factory");
      container.registerValue(Token, "exists");

      let ctx: ResolutionContext | undefined;
      container.registerFactory(FactoryToken, (c) => {
        ctx = c;
        const result = c.tryResolve(Token);
        expect(result).toBe("exists");
      });

      container.resolve(FactoryToken);
    });

    it("should provide tryResolve for missing tokens", () => {
      const container = new Container();
      const MissingToken = createToken<string>("Missing");
      const FactoryToken = createToken<void>("Factory");

      container.registerFactory(FactoryToken, (ctx) => {
        const result = ctx.tryResolve(MissingToken);
        expect(result).toBeUndefined();
      });

      container.resolve(FactoryToken);
    });

    it("should provide tryResolveAsync for existing tokens", async () => {
      const container = new Container();
      const Token = createToken<string>("Existing");
      const FactoryToken = createToken<void>("Factory");
      container.registerValue(Token, "async-exists");

      container.registerFactory(FactoryToken, async (ctx) => {
        const result = await ctx.tryResolveAsync(Token);
        expect(result).toBe("async-exists");
      });

      await container.resolveAsync(FactoryToken);
    });

    it("should have tags property", () => {
      const container = new Container();
      const FactoryToken = createToken<void>("Factory");
      container.registerFactory(FactoryToken, (ctx) => {
        expect(ctx.tags).toBeDefined();
      });

      container.resolve(FactoryToken);
    });
  });
});
