import { describe, it, expect } from "vitest";
import { Result } from "../Result.js";

describe("Result", () => {
  describe("ok", () => {
    it("creates a successful result with a value", () => {
      const result = Result.ok(42);
      expect(result.isOk).toBe(true);
      expect(result.isErr).toBe(false);
      expect(result.value).toBe(42);
    });

    it("throws when accessing error on ok result", () => {
      const result = Result.ok("hello");
      expect(() => result.error).toThrow();
    });
  });

  describe("fail", () => {
    it("creates a failed result with an error", () => {
      const result = Result.fail("something went wrong");
      expect(result.isOk).toBe(false);
      expect(result.isErr).toBe(true);
      expect(result.error).toBe("something went wrong");
    });

    it("throws when accessing value on failed result", () => {
      const result = Result.fail("error");
      expect(() => result.value).toThrow();
    });
  });

  describe("map", () => {
    it("transforms value on ok result", () => {
      const result = Result.ok(5).map((v) => v * 2);
      expect(result.value).toBe(10);
    });

    it("passes through error on fail result", () => {
      const result = Result.fail<number>("err").map((v) => v * 2);
      expect(result.isErr).toBe(true);
      expect(result.error).toBe("err");
    });
  });

  describe("flatMap", () => {
    it("chains ok results", () => {
      const result = Result.ok(5).flatMap((v) => Result.ok(v.toString()));
      expect(result.value).toBe("5");
    });

    it("short-circuits on fail", () => {
      const result = Result.fail<number>("err").flatMap((v) => Result.ok(v * 2));
      expect(result.isErr).toBe(true);
    });
  });
});
