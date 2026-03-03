import assert from "node:assert/strict";
import test from "node:test";
import type { TaskDTO } from "@kairos/shared";
import { getTodayTasks, getUpcomingTasks } from "./task-views.js";

function buildTask(overrides: Partial<TaskDTO>): TaskDTO {
  return {
    id: overrides.id ?? "task-1",
    title: overrides.title ?? "Task",
    description: overrides.description ?? null,
    status: overrides.status ?? "todo",
    priority: overrides.priority ?? 1,
    parentTaskId: overrides.parentTaskId ?? null,
    projectId: overrides.projectId ?? null,
    areaId: overrides.areaId ?? null,
    userId: overrides.userId ?? "user-1",
    dueDate: overrides.dueDate ?? null,
    duration: overrides.duration ?? null,
    durationUnit: overrides.durationUnit ?? null,
    createdAt: overrides.createdAt ?? "2026-03-01T10:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-03-01T10:00:00.000Z",
  };
}

test("getTodayTasks returns overdue and today tasks, excluding done and undated tasks", () => {
  const tasks = [
    buildTask({ id: "overdue", dueDate: "2026-03-01" }),
    buildTask({ id: "today", dueDate: "2026-03-02" }),
    buildTask({ id: "future", dueDate: "2026-03-03" }),
    buildTask({ id: "done-today", dueDate: "2026-03-02", status: "done" }),
    buildTask({ id: "no-date", dueDate: null }),
  ];

  assert.deepEqual(
    getTodayTasks(tasks, "2026-03-02").map((task) => task.id),
    ["overdue", "today"],
  );
});

test("getUpcomingTasks returns non-overdue dated tasks sorted by due date", () => {
  const tasks = [
    buildTask({ id: "later", dueDate: "2026-03-06" }),
    buildTask({ id: "today", dueDate: "2026-03-02" }),
    buildTask({ id: "tomorrow", dueDate: "2026-03-03" }),
    buildTask({ id: "overdue", dueDate: "2026-03-01" }),
    buildTask({ id: "done-future", dueDate: "2026-03-04", status: "done" }),
    buildTask({ id: "no-date", dueDate: null }),
  ];

  assert.deepEqual(
    getUpcomingTasks(tasks, "2026-03-02").map((task) => task.id),
    ["today", "tomorrow", "later"],
  );
});
