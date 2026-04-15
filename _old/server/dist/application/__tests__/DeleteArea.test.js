import { describe, expect, it } from "vitest";
import { DeleteArea } from "../area/DeleteArea.js";
import { InMemoryAreaRepository, InMemoryProjectRepository, InMemoryTaskRepository, SpyEventBus, } from "./mocks.js";
import { Area } from "../../domain/area/index.js";
import { Project } from "../../domain/project/index.js";
import { Task } from "../../domain/task/index.js";
describe("DeleteArea", () => {
    it("deletes an area, frees projects, and moves direct area tasks to inbox", async () => {
        const areaRepo = new InMemoryAreaRepository();
        const projectRepo = new InMemoryProjectRepository();
        const taskRepo = new InMemoryTaskRepository();
        const eventBus = new SpyEventBus();
        const deleteArea = new DeleteArea(areaRepo, projectRepo, taskRepo, eventBus);
        const area = Area.create("Product", "u1").value;
        const project = Project.create("Roadmap", "u1", area.id).value;
        const areaTask = Task.create("Area task", "u1", { areaId: area.id }).value;
        const projectTask = Task.create("Project task", "u1", { projectId: project.id }).value;
        area.clearDomainEvents();
        project.clearDomainEvents();
        areaTask.clearDomainEvents();
        projectTask.clearDomainEvents();
        await areaRepo.save(area);
        await projectRepo.save(project);
        await taskRepo.save(areaTask);
        await taskRepo.save(projectTask);
        const result = await deleteArea.execute({ id: area.id, userId: "u1" });
        expect(result.isOk).toBe(true);
        expect(await areaRepo.findById(area.id, "u1")).toBeNull();
        expect((await projectRepo.findById(project.id, "u1"))?.areaId).toBeNull();
        expect((await taskRepo.findById(areaTask.id, "u1"))?.isInInbox()).toBe(true);
        expect((await taskRepo.findById(projectTask.id, "u1"))?.projectId).toBe(project.id);
        expect(eventBus.published.map((event) => event.eventName)).toEqual([
            "project.moved_to_area",
            "task.moved_to_inbox",
            "area.deleted",
        ]);
    });
});
//# sourceMappingURL=DeleteArea.test.js.map