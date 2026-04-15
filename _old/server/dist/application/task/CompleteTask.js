import { Result } from "../../domain/shared/index.js";
import { toTaskDTO } from "../mappers.js";
export class CompleteTask {
    taskRepo;
    eventBus;
    constructor(taskRepo, eventBus) {
        this.taskRepo = taskRepo;
        this.eventBus = eventBus;
    }
    async execute(id, userId) {
        const task = await this.taskRepo.findById(id, userId);
        if (!task)
            return Result.fail("Task not found");
        const result = task.complete();
        if (result.isErr)
            return Result.fail(result.error);
        await this.taskRepo.save(task);
        await this.eventBus.publish(task.domainEvents);
        task.clearDomainEvents();
        return Result.ok(toTaskDTO(task));
    }
}
//# sourceMappingURL=CompleteTask.js.map