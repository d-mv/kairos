import { Result } from "../../domain/shared/index.js";
import { toTaskDTO } from "../mappers.js";
export class ReorderTask {
    taskRepo;
    eventBus;
    constructor(taskRepo, eventBus) {
        this.taskRepo = taskRepo;
        this.eventBus = eventBus;
    }
    async execute(input) {
        const task = await this.taskRepo.findById(input.taskId, input.userId);
        if (!task)
            return Result.fail("Task not found");
        const siblings = await this.taskRepo.findSiblings(task, input.userId);
        const newPosition = this.calcPosition(siblings, task.id, input.afterId);
        if (newPosition === null)
            return Result.fail("afterId not found in the same context");
        task.setPosition(newPosition);
        await this.taskRepo.save(task);
        await this.eventBus.publish(task.domainEvents);
        task.clearDomainEvents();
        return Result.ok(toTaskDTO(task));
    }
    calcPosition(siblings, movingId, afterId) {
        const sorted = [...siblings].sort((a, b) => a.position - b.position);
        const others = sorted.filter((s) => s.id !== movingId);
        if (afterId === null) {
            // Insert before the first item
            const first = others[0];
            return first ? first.position - 1000 : Date.now() / 1000;
        }
        const afterIndex = others.findIndex((s) => s.id === afterId);
        if (afterIndex === -1)
            return null;
        const after = others[afterIndex];
        const next = others[afterIndex + 1];
        if (!next) {
            return after.position + 1000;
        }
        return (after.position + next.position) / 2;
    }
}
//# sourceMappingURL=ReorderTask.js.map