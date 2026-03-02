import type { AreaRepository } from "../../domain/area/index.js";
import { AreaDeleted } from "../../domain/area/index.js";
import type { ProjectRepository } from "../../domain/project/index.js";
import { Result } from "../../domain/shared/index.js";
import type { TaskRepository } from "../../domain/task/index.js";
import type { EventBus } from "../EventBus.js";

export interface DeleteAreaInput {
  id: string;
  userId: string;
}

export class DeleteArea {
  constructor(
    private readonly areaRepo: AreaRepository,
    private readonly projectRepo: ProjectRepository,
    private readonly taskRepo: TaskRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: DeleteAreaInput): Promise<Result<void, string>> {
    const area = await this.areaRepo.findById(input.id, input.userId);
    if (!area) return Result.fail("Area not found");

    const projects = await this.projectRepo.findByAreaId(input.id, input.userId);
    for (const project of projects) {
      project.moveToArea(null);
      await this.projectRepo.save(project);
      await this.eventBus.publish(project.domainEvents);
      project.clearDomainEvents();
    }

    const tasks = await this.taskRepo.findByAreaId(input.id, input.userId);
    for (const task of tasks) {
      const result = task.moveToInbox();
      if (result.isErr) return Result.fail(result.error);
      await this.taskRepo.save(task);
      await this.eventBus.publish(task.domainEvents);
      task.clearDomainEvents();
    }

    await this.areaRepo.delete(input.id, input.userId);
    await this.eventBus.publish([new AreaDeleted(input.id)]);

    return Result.ok(undefined);
  }
}
