import { Result } from "../../domain/shared/index.js";
import { UniqueId } from "../../domain/shared/index.js";
class TaskDeletedEvent {
    taskId;
    eventId = new UniqueId().value;
    occurredOn = new Date();
    eventName = "task.deleted";
    constructor(taskId) {
        this.taskId = taskId;
    }
}
export class DeleteTask {
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
        await this.taskRepo.delete(id, userId);
        await this.eventBus.publish([new TaskDeletedEvent(id)]);
        return Result.ok(undefined);
    }
}
//# sourceMappingURL=DeleteTask.js.map