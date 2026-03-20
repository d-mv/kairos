import assert from "node:assert/strict";
import test from "node:test";
import type { ProjectDTO, TaskDTO } from "@kairos/shared";
import { getActiveProjects, getCompletedProjects, getProjectListItems } from "./project-views.js";

function buildProject(overrides: Partial<ProjectDTO>): ProjectDTO {
  return {
    id: overrides.id ?? "project-1",
    name: overrides.name ?? "Project",
    areaId: overrides.areaId ?? null,
    completedAt: overrides.completedAt ?? null,
    userId: overrides.userId ?? "user-1",
    createdAt: overrides.createdAt ?? "2026-03-01T10:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-03-01T10:00:00.000Z",
  };
}

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
    userId: overrides.userId ?? "user-1",
    dueDate: overrides.dueDate ?? null,
    duration: overrides.duration ?? null,
    durationUnit: overrides.durationUnit ?? null,
    tags: overrides.tags ?? [],
    position: overrides.position ?? 0,
    createdAt: overrides.createdAt ?? "2026-03-01T10:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-03-01T10:00:00.000Z",
  };
}

test("getActiveProjects excludes completed projects", () => {
  const projects = [
    buildProject({ id: "active-1", completedAt: null }),
    buildProject({ id: "done", completedAt: "2026-03-03T09:00:00.000Z" }),
    buildProject({ id: "active-2", completedAt: null }),
  ];

  assert.deepEqual(
    getActiveProjects(projects).map((project) => project.id),
    ["active-1", "active-2"],
  );
});

test("getCompletedProjects returns completed projects sorted by most recently completed", () => {
  const projects = [
    buildProject({ id: "oldest", completedAt: "2026-03-01T09:00:00.000Z" }),
    buildProject({ id: "active", completedAt: null }),
    buildProject({ id: "newest", completedAt: "2026-03-03T11:00:00.000Z" }),
    buildProject({ id: "middle", completedAt: "2026-03-02T10:00:00.000Z" }),
  ];

  assert.deepEqual(
    getCompletedProjects(projects).map((project) => project.id),
    ["newest", "middle", "oldest"],
  );
});

test("getProjectListItems returns open task counts and highest priority", () => {
  const projects = [buildProject({ id: "project-1" }), buildProject({ id: "project-2" })];
  const items = getProjectListItems(projects, [
    buildTask({ id: "a", projectId: "project-1", status: "todo", priority: 4 }),
    buildTask({ id: "b", projectId: "project-1", status: "todo", priority: 2 }),
    buildTask({ id: "c", projectId: "project-1", status: "done", priority: 1 }),
    buildTask({ id: "d", projectId: "project-2", status: "todo", priority: 3 }),
  ]);

  assert.deepEqual(items, [
    {
      project: projects[0],
      openTaskCount: 2,
      highestPriority: 2,
    },
    {
      project: projects[1],
      openTaskCount: 1,
      highestPriority: 3,
    },
  ]);
});
