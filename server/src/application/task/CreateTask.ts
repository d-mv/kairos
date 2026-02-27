import type { TaskDTO, TaskPriority, TaskDurationUnit } from '@kairos/shared';
import { Task } from '../../domain/task/index.js';
import type { TaskRepository } from '../../domain/task/index.js';
import { Result } from '../../domain/shared/index.js';
import type { EventBus } from '../EventBus.js';
import { toTaskDTO } from '../mappers.js';

export interface CreateTaskInput {
  title: string;
  userId: string;
  description?: string;
  priority?: TaskPriority;
  projectId?: string;
  areaId?: string;
  parentTaskId?: string;
  dueDate?: string;
  duration?: number;
  durationUnit?: TaskDurationUnit;
}

export class CreateTask {
  constructor(
    private readonly taskRepo: TaskRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: CreateTaskInput): Promise<Result<TaskDTO, string>> {
    // If adding a subtask, validate parent exists and can have subtasks
    if (input.parentTaskId) {
      const parent = await this.taskRepo.findById(input.parentTaskId, input.userId);
      if (!parent) return Result.fail('Parent task not found');
      const canAdd = parent.canHaveSubtask();
      if (canAdd.isErr) return Result.fail(canAdd.error);
    }

    const result = Task.create(input.title, input.userId, {
      description: input.description,
      priority: input.priority,
      projectId: input.projectId,
      areaId: input.areaId,
      parentTaskId: input.parentTaskId,
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      duration: input.duration,
      durationUnit: input.durationUnit,
    });
    if (result.isErr) return Result.fail(result.error);

    const task = result.value;
    await this.taskRepo.save(task);
    await this.eventBus.publish(task.domainEvents);
    task.clearDomainEvents();

    return Result.ok(toTaskDTO(task));
  }
}
