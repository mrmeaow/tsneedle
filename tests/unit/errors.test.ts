import { describe, expect, it } from "vitest";
import { CircularDependencyError } from "../../src/errors/circular-dependency-error.js";
import { DisposedContainerError } from "../../src/errors/disposed-container-error.js";
import { ResolutionError } from "../../src/errors/resolution-error.js";
import { AsyncFactoryError } from "../../src/errors/async-factory-error.js";
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
  });

  describe("DisposedContainerError", () => {
    it("should create error with message", () => {
      const error = new DisposedContainerError();

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toContain("disposed");
    });
  });
});
