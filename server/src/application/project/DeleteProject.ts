import type { ProjectRepository } from '../../domain/project/index.js';
import { ProjectDeleted } from '../../domain/project/index.js';
import { Result } from '../../domain/shared/index.js';
import type { EventBus } from '../EventBus.js';

export class DeleteProject {
  constructor(
    private readonly projectRepo: ProjectRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(id: string, userId: string): Promise<Result<void, string>> {
    const project = await this.projectRepo.findById(id, userId);
    if (!project) return Result.fail('Project not found');

    await this.projectRepo.delete(id, userId);
    await this.eventBus.publish([new ProjectDeleted(id)]);
    return Result.ok(undefined);
  }
}
