import { describe, it, expect, beforeEach } from "vitest";
import { DemoteProject } from "../project/DemoteProject.js";
import { CreateProject } from "../project/CreateProject.js";
import { CreateTask } from "../task/CreateTask.js";
import { InMemoryTaskRepository, InMemoryProjectRepository, SpyEventBus } from "./mocks.js";
describe("DemoteProject use case", () => {
    let taskRepo;
    let projectRepo;
    let eventBus;
    let demoteProject;
    let createProject;
    let createTask;
    beforeEach(() => {
        taskRepo = new InMemoryTaskRepository();
        projectRepo = new InMemoryProjectRepository();
        eventBus = new SpyEventBus();
        demoteProject = new DemoteProject(taskRepo, projectRepo, eventBus);
        createProject = new CreateProject(projectRepo, eventBus);
        createTask = new CreateTask(taskRepo, eventBus);
    });
    it("demotes an empty project to a task", async () => {
        const proj = await createProject.execute({ name: "My Project", userId: "u1" });
        eventBus.reset();
        const result = await demoteProject.execute(proj.value.id, "u1");
        expect(result.isOk).toBe(true);
        expect(result.value.title).toBe("My Project");
    });
    it("removes the project", async () => {
        const proj = await createProject.execute({ name: "P", userId: "u1" });
        await demoteProject.execute(proj.value.id, "u1");
        const found = projectRepo["store"].get(proj.value.id);
        expect(found).toBeUndefined();
    });
    it("converts project tasks to subtasks", async () => {
        const proj = await createProject.execute({ name: "P", userId: "u1" });
        await createTask.execute({ title: "Task A", userId: "u1", projectId: proj.value.id });
        await createTask.execute({ title: "Task B", userId: "u1", projectId: proj.value.id });
        const result = await demoteProject.execute(proj.value.id, "u1");
        const newTaskId = result.value.id;
        const subtasks = [...taskRepo.store.values()].filter((t) => t.parentTaskId === newTaskId);
        expect(subtasks).toHaveLength(2);
    });
    it("blocks demotion if a project task has subtasks", async () => {
        const proj = await createProject.execute({ name: "P", userId: "u1" });
        const task = await createTask.execute({
            title: "Task A",
            userId: "u1",
            projectId: proj.value.id,
        });
        await createTask.execute({
            title: "Subtask",
            userId: "u1",
            parentTaskId: task.value.id,
        });
        const result = await demoteProject.execute(proj.value.id, "u1");
        expect(result.isErr).toBe(true);
        expect(result.error).toMatch(/subtask/i);
    });
    it("fails if project not found", async () => {
        const result = await demoteProject.execute("nonexistent", "u1");
        expect(result.isErr).toBe(true);
    });
});
//# sourceMappingURL=DemoteProject.test.js.map