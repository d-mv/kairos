import { Task } from "../../domain/task/index.js";
import { Result } from "../../domain/shared/index.js";
import { toTaskDTO } from "../mappers.js";
import { normalizeTaskTitleLinks } from "./normalizeTaskTitleLinks.js";
export class CreateTask {
    taskRepo;
    eventBus;
    normalizeTitle;
    projectRepo;
    constructor(taskRepo, eventBus, normalizeTitle = normalizeTaskTitleLinks, projectRepo) {
        this.taskRepo = taskRepo;
        this.eventBus = eventBus;
        this.normalizeTitle = normalizeTitle;
        this.projectRepo = projectRepo;
    }
    async execute(input) {
        let taskUserId = input.userId;
        // If adding a subtask, validate parent exists and can have subtasks
        if (input.parentTaskId) {
            const parent = await this.taskRepo.findById(input.parentTaskId, input.userId);
            if (!parent)
                return Result.fail("Parent task not found");
            const canAdd = parent.canHaveSubtask();
            if (canAdd.isErr)
                return Result.fail(canAdd.error);
            taskUserId = parent.userId;
        }
        if (input.projectId) {
            if (!this.projectRepo)
                return Result.fail("Project repository not configured");
            const project = await this.projectRepo.findById(input.projectId, input.userId);
            if (!project)
                return Result.fail("Project not found");
            taskUserId = project.userId;
        }
        const normalizedTitle = await this.normalizeTitle(input.title);
        const result = Task.create(normalizedTitle, taskUserId, {
            description: input.description,
            priority: input.priority,
            projectId: input.projectId,
            areaId: input.areaId,
            parentTaskId: input.parentTaskId,
            dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
            duration: input.duration,
            durationUnit: input.durationUnit,
            tags: input.tags,
        });
        if (result.isErr)
            return Result.fail(result.error);
        const task = result.value;
        await this.taskRepo.save(task);
        await this.eventBus.publish(task.domainEvents);
        task.clearDomainEvents();
        return Result.ok(toTaskDTO(task));
    }
}
//# sourceMappingURL=CreateTask.js.map