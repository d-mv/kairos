import assert from "node:assert/strict";
import test from "node:test";
import { getTaskDetailSavePayload, hasTaskDetailDraftChanges } from "./task-detail-draft.js";

test("hasTaskDetailDraftChanges detects title edits", () => {
  assert.equal(
    hasTaskDetailDraftChanges({
      savedTitle: "Write docs",
      savedDescription: "draft",
      savedTags: [],
      savedPriority: 4,
      savedDueDate: "",
      savedDueTime: "",
      savedDuration: "",
      savedDurationUnit: "",
      title: "Write tests",
      description: "draft",
      tags: [],
      priority: 4,
      dueDate: "",
      dueTime: "",
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
      savedTags: ["backend"],
      savedPriority: 4,
      savedDueDate: "",
      savedDueTime: "",
      savedDuration: "2",
      savedDurationUnit: "d",
      title: "Write docs",
      description: "draft",
      tags: ["backend"],
      priority: 4,
      dueDate: "",
      dueTime: "",
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
      tags: [" ops ", "backend", "ops"],
      priority: 3,
      dueDate: "2026-03-25",
      dueTime: "14:30",
      duration: "2",
      durationUnit: "d",
    }),
    {
      ok: true,
      payload: {
        title: "Write docs",
        description: null,
        tags: ["ops", "backend"],
        priority: 3,
        dueDate: "2026-03-25T14:30:00.000Z",
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
      tags: [],
      priority: 4,
      dueDate: "",
      dueTime: "",
      duration: "2",
      durationUnit: "",
    }),
    {
      ok: false,
      error: "Set both duration and duration unit, or leave both empty",
    },
  );
});

test("hasTaskDetailDraftChanges detects tag edits", () => {
  assert.equal(
    hasTaskDetailDraftChanges({
      savedTitle: "Write docs",
      savedDescription: "draft",
      savedTags: ["backend"],
      savedPriority: 4,
      savedDueDate: "",
      savedDueTime: "",
      savedDuration: "",
      savedDurationUnit: "",
      title: "Write docs",
      description: "draft",
      tags: ["backend", "urgent"],
      priority: 4,
      dueDate: "",
      dueTime: "",
      duration: "",
      durationUnit: "",
    }),
    true,
  );
});
