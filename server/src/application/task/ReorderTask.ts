import type { TaskDTO } from "@kairos/shared";
import type { Task } from "../../domain/task/index.js";
import type { TaskRepository } from "../../domain/task/index.js";
import { Result } from "../../domain/shared/index.js";
import type { EventBus } from "../EventBus.js";
import { toTaskDTO } from "../mappers.js";

export interface ReorderTaskInput {
  taskId: string;
  /** The task after which to insert. null = move to the very beginning of the list. */
  afterId: string | null;
  userId: string;
}

export class ReorderTask {
  constructor(
    private readonly taskRepo: TaskRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: ReorderTaskInput): Promise<Result<TaskDTO, string>> {
    const task = await this.taskRepo.findById(input.taskId, input.userId);
    if (!task) return Result.fail("Task not found");

    const siblings = await this.taskRepo.findSiblings(task, input.userId);
    const newPosition = this.calcPosition(siblings, task.id, input.afterId);
    if (newPosition === null) return Result.fail("afterId not found in the same context");

    task.setPosition(newPosition);
    await this.taskRepo.save(task);
    await this.eventBus.publish(task.domainEvents);
    task.clearDomainEvents();

    return Result.ok(toTaskDTO(task));
  }

  private calcPosition(siblings: Task[], movingId: string, afterId: string | null): number | null {
    const sorted = [...siblings].sort((a, b) => a.position - b.position);
    const others = sorted.filter((s) => s.id !== movingId);

    if (afterId === null) {
      // Insert before the first item
      const first = others[0];
      return first ? first.position - 1000 : Date.now() / 1000;
    }

    const afterIndex = others.findIndex((s) => s.id === afterId);
    if (afterIndex === -1) return null;

    const after = others[afterIndex]!;
    const next = others[afterIndex + 1];

    if (!next) {
      return after.position + 1000;
    }

    return (after.position + next.position) / 2;
  }
}
