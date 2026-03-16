import { beforeEach, describe, expect, it } from "vitest";
import { CreateProject } from "../project/CreateProject.js";
import { UpdateProject } from "../project/UpdateProject.js";
import { InMemoryProjectRepository, SpyEventBus } from "./mocks.js";

describe("UpdateProject use case", () => {
  let projectRepo: InMemoryProjectRepository;
  let eventBus: SpyEventBus;
  let createProject: CreateProject;
  let updateProject: UpdateProject;

  beforeEach(() => {
    projectRepo = new InMemoryProjectRepository();
    eventBus = new SpyEventBus();
    createProject = new CreateProject(projectRepo, eventBus);
    updateProject = new UpdateProject(projectRepo, eventBus);
  });

  it("marks a project as completed", async () => {
    const created = await createProject.execute({ name: "Project", userId: "user-1" });

    const result = await updateProject.execute({
      id: created.value.id,
      userId: "user-1",
      completedAt: "2026-03-15T12:00:00.000Z",
    });

    expect(result.isOk).toBe(true);
    expect(result.value.completedAt).toBe("2026-03-15T12:00:00.000Z");
  });

  it("reopens a completed project", async () => {
    const created = await createProject.execute({ name: "Project", userId: "user-1" });
    await updateProject.execute({
      id: created.value.id,
      userId: "user-1",
      completedAt: "2026-03-15T12:00:00.000Z",
    });

    const result = await updateProject.execute({
      id: created.value.id,
      userId: "user-1",
      completedAt: null,
    });

    expect(result.isOk).toBe(true);
    expect(result.value.completedAt).toBeNull();
  });
});
