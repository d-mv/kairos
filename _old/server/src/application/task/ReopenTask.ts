import type { TaskDTO } from "@kairos/shared";
import { Result } from "../../domain/shared/index.js";
import type { TaskRepository } from "../../domain/task/index.js";
import type { EventBus } from "../EventBus.js";
import { toTaskDTO } from "../mappers.js";

export class ReopenTask {
  constructor(
    private readonly taskRepo: TaskRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(id: string, userId: string): Promise<Result<TaskDTO, string>> {
    const task = await this.taskRepo.findById(id, userId);
    if (!task) return Result.fail("Task not found");

    const result = task.reopen();
    if (result.isErr) return Result.fail(result.error);

    await this.taskRepo.save(task);
    await this.eventBus.publish(task.domainEvents);
    task.clearDomainEvents();

    return Result.ok(toTaskDTO(task));
  }
}
