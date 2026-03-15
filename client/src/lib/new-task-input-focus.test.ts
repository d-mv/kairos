import assert from "node:assert/strict";
import test from "node:test";
import { shouldRestoreNewTaskInputFocus } from "./new-task-input-focus.js";

test("restores focus when a successful save finishes loading", () => {
  assert.equal(
    shouldRestoreNewTaskInputFocus({
      wasLoading: true,
      loading: false,
      pendingRestore: true,
    }),
    true,
  );
});

test("does not restore focus while a save is still loading", () => {
  assert.equal(
    shouldRestoreNewTaskInputFocus({
      wasLoading: true,
      loading: true,
      pendingRestore: true,
    }),
    false,
  );
});

test("does not restore focus when no successful save requested it", () => {
  assert.equal(
    shouldRestoreNewTaskInputFocus({
      wasLoading: true,
      loading: false,
      pendingRestore: false,
    }),
    false,
  );
});
