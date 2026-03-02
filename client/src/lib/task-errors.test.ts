import test from "node:test";
import assert from "node:assert/strict";
import { getTaskErrorMessage } from "./task-errors.js";

test("getTaskErrorMessage returns the original Error message", () => {
  assert.equal(getTaskErrorMessage(new Error("Failed to save task"), "fallback"), "Failed to save task");
});

test("getTaskErrorMessage falls back for non-Error values", () => {
  assert.equal(getTaskErrorMessage("bad", "fallback"), "fallback");
  assert.equal(getTaskErrorMessage(null, "fallback"), "fallback");
});
