import assert from "node:assert/strict";
import test from "node:test";
import type { AreaDTO, BrainPageDTO, ProjectDTO, TaskDTO } from "@kairos/shared";
import { searchWorkspace } from "./search.js";

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

function buildProject(overrides: Partial<ProjectDTO>): ProjectDTO {
  return {
    id: overrides.id ?? "project-1",
    name: overrides.name ?? "Project",
    areaId: overrides.areaId ?? null,
    completedAt: overrides.completedAt ?? null,
    userId: overrides.userId ?? "u1",
    createdAt: overrides.createdAt ?? "2026-03-15T00:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-03-15T00:00:00.000Z",
  };
}

function buildArea(overrides: Partial<AreaDTO>): AreaDTO {
  return {
    id: overrides.id ?? "area-1",
    name: overrides.name ?? "Area",
    userId: overrides.userId ?? "u1",
    createdAt: overrides.createdAt ?? "2026-03-15T00:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-03-15T00:00:00.000Z",
  };
}

function buildBrainPage(overrides: Partial<BrainPageDTO>): BrainPageDTO {
  return {
    id: overrides.id ?? "page-1",
    title: overrides.title ?? "Page",
    folderId: overrides.folderId ?? null,
    contentJson: overrides.contentJson ?? null,
    userId: overrides.userId ?? "u1",
    createdAt: overrides.createdAt ?? "2026-03-15T00:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-03-15T00:00:00.000Z",
  };
}

test("searchWorkspace matches tasks, projects, areas, and brain pages case-insensitively", () => {
  const results = searchWorkspace("road", {
    tasks: [
      buildTask({
        id: "task-1",
        title: "Roadmap review",
        description: "Check launch blockers",
        projectId: "project-1",
      }),
      buildTask({ id: "task-2", title: "Inbox item", tags: ["finance"] }),
    ],
    projects: [buildProject({ id: "project-1", name: "Roadmap" })],
    areas: [buildArea({ id: "area-1", name: "Road Operations" })],
    brainPages: [buildBrainPage({ id: "page-1", title: "Road trip notes" })],
  });

  assert.deepEqual(
    results.map((result) => ({ kind: result.kind, id: result.id, route: result.route })),
    [
      { kind: "task", id: "task-1", route: "/project/project-1" },
      { kind: "project", id: "project-1", route: "/project/project-1" },
      { kind: "area", id: "area-1", route: "/area/area-1" },
      { kind: "brain_page", id: "page-1", route: "/brain/page/page-1" },
    ],
  );
});

test("searchWorkspace matches task descriptions and tags and ignores blank queries", () => {
  const task = buildTask({
    id: "task-1",
    title: "Prepare invoice",
    description: "Pending payment follow-up",
    tags: ["finance"],
  });

  assert.deepEqual(
    searchWorkspace("payment", {
      tasks: [task],
      projects: [],
      areas: [],
      brainPages: [],
    }).map((result) => result.id),
    ["task-1"],
  );

  assert.deepEqual(
    searchWorkspace("   ", {
      tasks: [task],
      projects: [],
      areas: [],
      brainPages: [],
    }),
    [],
  );
});
