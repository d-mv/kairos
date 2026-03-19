import assert from "node:assert/strict";
import test from "node:test";
import type { TaskDTO } from "@kairos/shared";
import { getProjectGanttData, getTaskSpanDays } from "./project-gantt.js";

function buildTask(overrides: Partial<TaskDTO>): TaskDTO {
  return {
    id: overrides.id ?? "task-1",
    title: overrides.title ?? "Task",
    description: overrides.description ?? null,
    status: overrides.status ?? "todo",
    priority: overrides.priority ?? 4,
    parentTaskId: overrides.parentTaskId ?? null,
    projectId: overrides.projectId ?? null,
    areaId: overrides.areaId ?? null,
    userId: overrides.userId ?? "u1",
    dueDate: overrides.dueDate ?? null,
    duration: overrides.duration ?? null,
    durationUnit: overrides.durationUnit ?? null,
    tags: overrides.tags ?? [],
    position: overrides.position ?? 0,
    createdAt: overrides.createdAt ?? "2026-03-15T00:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-03-15T00:00:00.000Z",
  };
}

test("getTaskSpanDays expands supported duration units to calendar days", () => {
  assert.equal(getTaskSpanDays(4, "h"), 1);
  assert.equal(getTaskSpanDays(3, "d"), 3);
  assert.equal(getTaskSpanDays(2, "w"), 14);
  assert.equal(getTaskSpanDays(2, "m"), 60);
  assert.equal(getTaskSpanDays(null, null), 1);
});

test("getProjectGanttData derives inclusive task ranges from due date and duration", () => {
  const gantt = getProjectGanttData([
    buildTask({
      id: "spec",
      title: "Write spec",
      dueDate: "2026-03-10",
      duration: 3,
      durationUnit: "d",
    }),
    buildTask({
      id: "ship",
      title: "Ship",
      dueDate: "2026-03-12",
    }),
  ]);

  assert.deepEqual(gantt.columns, [
    "2026-03-08",
    "2026-03-09",
    "2026-03-10",
    "2026-03-11",
    "2026-03-12",
  ]);
  assert.deepEqual(
    gantt.items.map((item) => ({
      id: item.task.id,
      startDate: item.startDate,
      endDate: item.endDate,
      startOffsetDays: item.startOffsetDays,
      spanDays: item.spanDays,
    })),
    [
      {
        id: "spec",
        startDate: "2026-03-08",
        endDate: "2026-03-10",
        startOffsetDays: 0,
        spanDays: 3,
      },
      {
        id: "ship",
        startDate: "2026-03-12",
        endDate: "2026-03-12",
        startOffsetDays: 4,
        spanDays: 1,
      },
    ],
  );
});

test("getProjectGanttData ignores tasks without due dates", () => {
  const gantt = getProjectGanttData([
    buildTask({ id: "undated", dueDate: null }),
    buildTask({ id: "dated", dueDate: "2026-03-20" }),
  ]);

  assert.deepEqual(gantt.columns, ["2026-03-20"]);
  assert.equal(gantt.items.length, 1);
  assert.equal(gantt.items[0]?.task.id, "dated");
});
