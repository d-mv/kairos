import type { TaskDTO } from "@kairos/shared";
import type { TaskRepository } from "../../domain/task/index.js";
import type { ProjectRepository } from "../../domain/project/index.js";
import { Task } from "../../domain/task/index.js";
import { ProjectDeleted } from "../../domain/project/index.js";
import { Result } from "../../domain/shared/index.js";
import type { EventBus } from "../EventBus.js";
import { toTaskDTO } from "../mappers.js";

export class DemoteProject {
  constructor(
    private readonly taskRepo: TaskRepository,
    private readonly projectRepo: ProjectRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(projectId: string, userId: string): Promise<Result<TaskDTO, string>> {
    const project = await this.projectRepo.findById(projectId, userId);
    if (!project) return Result.fail("Project not found");

    // Load all tasks in this project
    const projectTasks = await this.taskRepo.findByProjectId(projectId, userId);

    // Block demotion if any task has subtasks
    for (const task of projectTasks) {
      const subtasks = await this.taskRepo.findSubtasks(task.id, userId);
      if (subtasks.length > 0) {
        return Result.fail(
          `Cannot demote project: task "${task.title}" has subtasks. Remove subtasks first.`,
        );
      }
    }

    // Create the new top-level task from the project
    const newTaskResult = Task.create(project.name, userId, {
      areaId: project.areaId ?? undefined,
    });
    if (newTaskResult.isErr) return Result.fail(newTaskResult.error);
    const newTask = newTaskResult.value;

    // Create subtasks from existing project tasks
    const newSubtasks: Task[] = [];
    for (const t of projectTasks) {
      const subtaskResult = Task.create(t.title, userId, {
        description: t.description ?? undefined,
        priority: t.priority,
        parentTaskId: newTask.id,
        dueDate: t.dueDate ?? undefined,
        duration: t.duration ?? undefined,
        durationUnit: t.durationUnit ?? undefined,
      });
      if (subtaskResult.isErr) return Result.fail(subtaskResult.error);
      newSubtasks.push(subtaskResult.value);
    }

    // Persist: save new task + subtasks, delete old tasks, delete project
    await this.taskRepo.save(newTask);
    for (const st of newSubtasks) {
      await this.taskRepo.save(st);
    }
    for (const t of projectTasks) {
      await this.taskRepo.delete(t.id, userId);
    }
    await this.projectRepo.delete(projectId, userId);

    const allEvents = [
      ...newTask.domainEvents,
      ...newSubtasks.flatMap((t) => t.domainEvents),
      new ProjectDeleted(projectId),
    ];
    await this.eventBus.publish(allEvents);

    return Result.ok(toTaskDTO(newTask));
  }
}
