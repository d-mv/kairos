import type { TaskRepository } from "../../domain/task/index.js";
import { Result } from "../../domain/shared/index.js";
import type { EventBus } from "../EventBus.js";
import { UniqueId } from "../../domain/shared/index.js";
import type { DomainEvent } from "../../domain/shared/index.js";

class TaskDeletedEvent implements DomainEvent {
  readonly eventId = new UniqueId().value;
  readonly occurredOn = new Date();
  readonly eventName = "task.deleted";
  constructor(public readonly taskId: string) {}
}

export class DeleteTask {
  constructor(
    private readonly taskRepo: TaskRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(id: string, userId: string): Promise<Result<void, string>> {
    const task = await this.taskRepo.findById(id, userId);
    if (!task) return Result.fail("Task not found");

    await this.taskRepo.delete(id, userId);
    await this.eventBus.publish([new TaskDeletedEvent(id)]);
    return Result.ok(undefined);
  }
}
