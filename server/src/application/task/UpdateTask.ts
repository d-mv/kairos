import type { TaskDTO, TaskPriority, TaskDurationUnit } from '@kairos/shared';
import type { TaskRepository } from '../../domain/task/index.js';
import { Result } from '../../domain/shared/index.js';
import type { EventBus } from '../EventBus.js';
import { toTaskDTO } from '../mappers.js';

export interface UpdateTaskInput {
  id: string;
  userId: string;
  title?: string;
  description?: string | null;
  priority?: TaskPriority;
  projectId?: string | null;
  areaId?: string | null;
  dueDate?: string | null;
  duration?: number | null;
  durationUnit?: TaskDurationUnit | null;
}

export class UpdateTask {
  constructor(
    private readonly taskRepo: TaskRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: UpdateTaskInput): Promise<Result<TaskDTO, string>> {
    const task = await this.taskRepo.findById(input.id, input.userId);
    if (!task) return Result.fail('Task not found');

    if (input.title !== undefined) {
      const r = task.updateTitle(input.title);
      if (r.isErr) return Result.fail(r.error);
    }

    if ('description' in input) {
      task.updateDescription(input.description ?? null);
    }

    if (input.priority !== undefined) {
      task.updatePriority(input.priority);
    }

    if ('dueDate' in input) {
      task.updateDueDate(input.dueDate ? new Date(input.dueDate) : null);
    }

    if ('duration' in input || 'durationUnit' in input) {
      const duration = 'duration' in input ? input.duration ?? null : task.duration;
      const unit = 'durationUnit' in input ? input.durationUnit ?? null : task.durationUnit;
      const r = task.updateDuration(duration, unit);
      if (r.isErr) return Result.fail(r.error);
    }

    if (input.projectId !== undefined && input.projectId !== null) {
      const r = task.assignToProject(input.projectId);
      if (r.isErr) return Result.fail(r.error);
    } else if (input.areaId !== undefined && input.areaId !== null) {
      const r = task.assignToArea(input.areaId);
      if (r.isErr) return Result.fail(r.error);
    } else if (input.projectId === null && input.areaId === null) {
      const r = task.moveToInbox();
      if (r.isErr) return Result.fail(r.error);
    }

    await this.taskRepo.save(task);
    await this.eventBus.publish(task.domainEvents);
    task.clearDomainEvents();

    return Result.ok(toTaskDTO(task));
  }
}
