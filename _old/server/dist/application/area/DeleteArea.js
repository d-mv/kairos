import { AreaDeleted } from "../../domain/area/index.js";
import { Result } from "../../domain/shared/index.js";
export class DeleteArea {
    areaRepo;
    projectRepo;
    taskRepo;
    eventBus;
    constructor(areaRepo, projectRepo, taskRepo, eventBus) {
        this.areaRepo = areaRepo;
        this.projectRepo = projectRepo;
        this.taskRepo = taskRepo;
        this.eventBus = eventBus;
    }
    async execute(input) {
        const area = await this.areaRepo.findById(input.id, input.userId);
        if (!area)
            return Result.fail("Area not found");
        const projects = await this.projectRepo.findByAreaId(input.id, input.userId);
        for (const project of projects) {
            project.moveToArea(null);
            await this.projectRepo.save(project);
            await this.eventBus.publish(project.domainEvents);
            project.clearDomainEvents();
        }
        const tasks = await this.taskRepo.findByAreaId(input.id, input.userId);
        for (const task of tasks) {
            const result = task.moveToInbox();
            if (result.isErr)
                return Result.fail(result.error);
            await this.taskRepo.save(task);
            await this.eventBus.publish(task.domainEvents);
            task.clearDomainEvents();
        }
        await this.areaRepo.delete(input.id, input.userId);
        await this.eventBus.publish([new AreaDeleted(input.id)]);
        return Result.ok(undefined);
    }
}
//# sourceMappingURL=DeleteArea.js.map