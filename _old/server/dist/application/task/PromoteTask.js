import { Project } from "../../domain/project/index.js";
import { Task } from "../../domain/task/index.js";
import { Result } from "../../domain/shared/index.js";
import { toProjectDTO } from "../mappers.js";
export class PromoteTask {
    taskRepo;
    projectRepo;
    eventBus;
    constructor(taskRepo, projectRepo, eventBus) {
        this.taskRepo = taskRepo;
        this.projectRepo = projectRepo;
        this.eventBus = eventBus;
    }
    async execute(taskId, userId) {
        const task = await this.taskRepo.findById(taskId, userId);
        if (!task)
            return Result.fail("Task not found");
        if (task.isSubtask())
            return Result.fail("A subtask cannot be promoted to a project");
        // Create new project with same area as the task
        const projectResult = Project.create(task.title, userId, task.areaId);
        if (projectResult.isErr)
            return Result.fail(projectResult.error);
        const project = projectResult.value;
        // Load subtasks and re-create them as project tasks
        const subtasks = await this.taskRepo.findSubtasks(taskId, userId);
        const newTasks = [];
        for (const subtask of subtasks) {
            const newTaskResult = Task.create(subtask.title, userId, {
                description: subtask.description ?? undefined,
                priority: subtask.priority,
                projectId: project.id,
                dueDate: subtask.dueDate ?? undefined,
                duration: subtask.duration ?? undefined,
                durationUnit: subtask.durationUnit ?? undefined,
                tags: subtask.tags,
            });
            if (newTaskResult.isErr)
                return Result.fail(newTaskResult.error);
            newTasks.push(newTaskResult.value);
        }
        // Persist: save project, save new tasks, delete old subtasks, delete original task
        await this.projectRepo.save(project);
        for (const t of newTasks) {
            await this.taskRepo.save(t);
        }
        for (const subtask of subtasks) {
            await this.taskRepo.delete(subtask.id, userId);
        }
        await this.taskRepo.delete(taskId, userId);
        const allEvents = [...project.domainEvents, ...newTasks.flatMap((t) => t.domainEvents)];
        await this.eventBus.publish(allEvents);
        project.clearDomainEvents();
        newTasks.forEach((t) => t.clearDomainEvents());
        return Result.ok(toProjectDTO(project));
    }
}
//# sourceMappingURL=PromoteTask.js.map