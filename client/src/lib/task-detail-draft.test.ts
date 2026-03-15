import assert from "node:assert/strict";
import test from "node:test";
import { getTaskDetailSavePayload, hasTaskDetailDraftChanges } from "./task-detail-draft.js";

test("hasTaskDetailDraftChanges detects title edits", () => {
  assert.equal(
    hasTaskDetailDraftChanges({
      savedTitle: "Write docs",
      savedDescription: "draft",
      savedPriority: 4,
      savedDueDate: "",
      savedDuration: "",
      savedDurationUnit: "",
      title: "Write tests",
      description: "draft",
      priority: 4,
      dueDate: "",
      duration: "",
      durationUnit: "",
    }),
    true,
  );
});

test("hasTaskDetailDraftChanges ignores identical state", () => {
  assert.equal(
    hasTaskDetailDraftChanges({
      savedTitle: "Write docs",
      savedDescription: "draft",
      savedPriority: 4,
      savedDueDate: "",
      savedDuration: "2",
      savedDurationUnit: "d",
      title: "Write docs",
      description: "draft",
      priority: 4,
      dueDate: "",
      duration: "2",
      durationUnit: "d",
    }),
    false,
  );
});

test("getTaskDetailSavePayload trims title and parses duration", () => {
  assert.deepEqual(
    getTaskDetailSavePayload({
      title: "  Write docs  ",
      description: "",
      priority: 3,
      dueDate: "",
      duration: "2",
      durationUnit: "d",
    }),
    {
      ok: true,
      payload: {
        title: "Write docs",
        description: null,
        priority: 3,
        dueDate: null,
        duration: 2,
        durationUnit: "d",
      },
    },
  );
});

test("getTaskDetailSavePayload rejects partial duration", () => {
  assert.deepEqual(
    getTaskDetailSavePayload({
      title: "Write docs",
      description: "",
      priority: 4,
      dueDate: "",
      duration: "2",
      durationUnit: "",
    }),
    {
      ok: false,
      error: "Set both duration and duration unit, or leave both empty",
    },
  );
});
