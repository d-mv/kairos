import { beforeEach, describe, expect, it } from "vitest";
import { CreateProject } from "../project/CreateProject.js";
import { InMemoryProjectRepository, SpyEventBus } from "./mocks.js";

describe("CreateProject use case", () => {
  let projectRepo: InMemoryProjectRepository;
  let eventBus: SpyEventBus;
  let createProject: CreateProject;

  beforeEach(() => {
    projectRepo = new InMemoryProjectRepository();
    eventBus = new SpyEventBus();
    createProject = new CreateProject(projectRepo, eventBus);
  });

  it("creates a project in area when areaId is provided", async () => {
    const areaId = "e53f5f5d-2d16-4b57-a8be-9a8fbb0d6a99";
    const result = await createProject.execute({
      name: "Roadmap",
      userId: "user-1",
      areaId,
    });

    expect(result.isOk).toBe(true);
    expect(result.value.areaId).toBe(areaId);
    expect(projectRepo.store.get(result.value.id)?.areaId).toBe(areaId);
    expect(eventBus.published).toHaveLength(1);
    expect(eventBus.published[0]!.eventName).toBe("project.created");
  });

  it("creates an unassigned project when areaId is omitted", async () => {
    const result = await createProject.execute({
      name: "Backlog",
      userId: "user-1",
    });

    expect(result.isOk).toBe(true);
    expect(result.value.areaId).toBeNull();
  });
});
