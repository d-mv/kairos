import assert from "node:assert/strict";
import test from "node:test";
import type { ProjectDTO } from "@kairos/shared";
import { getActiveProjects, getCompletedProjects } from "./project-views.js";

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
