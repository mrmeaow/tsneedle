import { describe, expect, it } from "vitest";
import { AsyncFactoryError } from "../../src/errors/async-factory-error.js";
import { CircularDependencyError } from "../../src/errors/circular-dependency-error.js";
import { DisposedContainerError } from "../../src/errors/disposed-container-error.js";
import { ResolutionError } from "../../src/errors/resolution-error.js";
import { createToken } from "../../src/token/token.js";

describe("Error Classes", () => {
  describe("CircularDependencyError", () => {
    it("should create error with token name", () => {
      const token = createToken<object>("CircularService");
      const error = new CircularDependencyError(token);

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toContain("Circular dependency detected");
      expect(error.message).toContain("CircularService");
    });

    it("should include chain if provided", () => {
      const token = createToken<object>("CircularService");
      const error = new CircularDependencyError(token, ["A", "B"]);

      expect(error.message).toContain("A → B");
    });

    it("should handle token without name property (string)", () => {
      const error = new CircularDependencyError("PlainString");

      expect(error.message).toContain("Circular dependency detected");
      expect(error.message).toContain("PlainString");
    });

    it("should handle token without name property (number)", () => {
      const error = new CircularDependencyError(123);

      expect(error.message).toContain("Circular dependency detected");
      expect(error.message).toContain("123");
    });

    it("should handle empty chain", () => {
      const token = createToken<object>("CircularService");
      const error = new CircularDependencyError(token, []);

      expect(error.message).not.toContain("→");
    });

    it("should handle chain with length 0 but truthy (array)", () => {
      // Edge case: chain is an array with length 0
      const error = new CircularDependencyError("Test", [] as any);

      expect(error.message).toContain("Circular dependency detected");
    });

    it("should handle chain with objects containing name property", () => {
      // This tests line 12 - the map with name property extraction
      const token1 = createToken<object>("ServiceA");
      const token2 = createToken<object>("ServiceB");
      const error = new CircularDependencyError(token1, [token1, token2]);

      expect(error.message).toContain("ServiceA → ServiceB");
    });
  });

  describe("ResolutionError", () => {
    it("should create error with token name", () => {
      const token = createToken<string>("MissingToken");
      const error = new ResolutionError(token);

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toContain("MissingToken");
    });

    it("should include registered tokens in hint", () => {
      const token = createToken<string>("MissingToken");
      const registered = createToken<string>("known");
      const error = new ResolutionError(token, [], [registered]);

      expect(error.message).toContain("MissingToken");
      expect(error.message).toContain("Did you forget to register");
    });

    it("should include scope path", () => {
      const token = createToken<string>("ScopedToken");
      const error = new ResolutionError(token, ["root", "request"]);

      expect(error.message).toContain("root → request");
    });

    it("should handle string token without name property", () => {
      const error = new ResolutionError("PlainString");

      expect(error.message).toContain("No binding found for token");
      expect(error.message).toContain("PlainString");
    });

    it("should handle number token without name property", () => {
      const error = new ResolutionError(42);

      expect(error.message).toContain("No binding found for token");
      expect(error.message).toContain("42");
    });

    it("should handle empty registered tokens array (no hint)", () => {
      const token = createToken<string>("MissingToken");
      const error = new ResolutionError(token, [], []);

      expect(error.message).not.toContain("Hint:");
    });

    it("should handle empty scope path (no scope in message)", () => {
      const token = createToken<string>("MissingToken");
      const error = new ResolutionError(token, []);

      expect(error.message).not.toContain("in scopes");
    });
  });

  describe("AsyncFactoryError", () => {
    it("should create error with token name", () => {
      const token = createToken<object>("AsyncService");
      const error = new AsyncFactoryError(token);

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toContain("AsyncService");
    });

    it("should include cause if provided", () => {
      const token = createToken<object>("AsyncService");
      const cause = new Error("network timeout");
      const error = new AsyncFactoryError(token, cause);

      expect(error.cause).toBe(cause);
    });

    it("should handle token without name property (string)", () => {
      const error = new AsyncFactoryError("PlainString");

      expect(error.message).toContain("Async factory for");
      expect(error.message).toContain("PlainString");
    });

    it("should handle token without name property (number)", () => {
      const error = new AsyncFactoryError(123);

      expect(error.message).toContain("Async factory for");
      expect(error.message).toContain("123");
    });
  });

  describe("DisposedContainerError", () => {
    it("should create error with message", () => {
      const error = new DisposedContainerError();

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toContain("disposed");
    });
  });
});
