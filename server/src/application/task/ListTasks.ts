import type { TaskDTO } from '@kairos/shared';
import type { TaskRepository } from '../../domain/task/index.js';
import { Result } from '../../domain/shared/index.js';
import { toTaskDTO } from '../mappers.js';

export interface ListTasksInput {
  userId: string;
  projectId?: string;
  areaId?: string;
  inbox?: boolean;
  parentTaskId?: string;
}

export class ListTasks {
  constructor(private readonly taskRepo: TaskRepository) {}

  async execute(input: ListTasksInput): Promise<Result<TaskDTO[], string>> {
    let tasks;
    if (input.projectId) {
      tasks = await this.taskRepo.findByProjectId(input.projectId, input.userId);
    } else if (input.areaId) {
      tasks = await this.taskRepo.findByAreaId(input.areaId, input.userId);
    } else if (input.inbox) {
      tasks = await this.taskRepo.findInbox(input.userId);
    } else if (input.parentTaskId) {
      tasks = await this.taskRepo.findSubtasks(input.parentTaskId, input.userId);
    } else {
      tasks = await this.taskRepo.findAll(input.userId);
    }
    return Result.ok(tasks.map(toTaskDTO));
  }
}
