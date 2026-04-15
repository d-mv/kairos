import assert from "node:assert/strict";
import test from "node:test";
import type { TaskDTO } from "@kairos/shared";
import {
  getTaskCalendarAgendaTasks,
  getNextTaskCalendarMonth,
  getPreviousTaskCalendarMonth,
  getTaskCalendarData,
} from "./task-calendar.js";

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

test("getTaskCalendarData returns null when no tasks have due dates", () => {
  assert.equal(getTaskCalendarData([buildTask({ dueDate: null })]), null);
});

test("getTaskCalendarData builds a monday-first month grid and places tasks on due dates", () => {
  const calendar = getTaskCalendarData(
    [
      buildTask({ id: "a", title: "Alpha", dueDate: "2026-03-03" }),
      buildTask({ id: "b", title: "Beta", dueDate: "2026-03-18" }),
    ],
    "2026-03-10",
  );

  assert.ok(calendar);
  assert.equal(calendar.monthLabel, "2026-03-01");
  assert.equal(calendar.weeks.length, 6);
  assert.equal(calendar.weeks[0]?.[0]?.date, "2026-02-23");
  assert.equal(calendar.weeks[5]?.[6]?.date, "2026-04-05");
  assert.deepEqual(
    calendar.weeks
      .flat()
      .find((day) => day.date === "2026-03-03")
      ?.tasks.map((task) => task.id),
    ["a"],
  );
  assert.deepEqual(
    calendar.weeks
      .flat()
      .find((day) => day.date === "2026-03-18")
      ?.tasks.map((task) => task.id),
    ["b"],
  );
});

test("task calendar month helpers move between adjacent months", () => {
  assert.equal(getPreviousTaskCalendarMonth("2026-03-01"), "2026-02-01");
  assert.equal(getNextTaskCalendarMonth("2026-03-01"), "2026-04-01");
});

test("getTaskCalendarAgendaTasks returns tasks for a day sorted by priority", () => {
  const tasks = getTaskCalendarAgendaTasks(
    [
      buildTask({ id: "b", title: "Beta", dueDate: "2026-03-18", priority: 3 }),
      buildTask({ id: "a", title: "Alpha", dueDate: "2026-03-18", priority: 1 }),
      buildTask({ id: "c", title: "Gamma", dueDate: "2026-03-19", priority: 2 }),
    ],
    "2026-03-18",
  );

  assert.deepEqual(
    tasks.map((task) => task.id),
    ["a", "b"],
  );
});
