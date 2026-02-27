import { describe, it, expect } from "vitest";
import { UniqueId } from "../UniqueId.js";

describe("UniqueId", () => {
  it("generates a uuid when none provided", () => {
    const id = new UniqueId();
    expect(id.value).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it("uses provided value", () => {
    const id = new UniqueId("my-custom-id");
    expect(id.value).toBe("my-custom-id");
    expect(id.toString()).toBe("my-custom-id");
  });

  it("two generated ids are unique", () => {
    const a = new UniqueId();
    const b = new UniqueId();
    expect(a.equals(b)).toBe(false);
  });

  it("same value means equal", () => {
    const a = new UniqueId("abc");
    const b = new UniqueId("abc");
    expect(a.equals(b)).toBe(true);
  });
});
