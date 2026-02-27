import type { ProjectDTO } from '@kairos/shared';
import { Project } from '../../domain/project/index.js';
import type { ProjectRepository } from '../../domain/project/index.js';
import { Result } from '../../domain/shared/index.js';
import type { EventBus } from '../EventBus.js';
import { toProjectDTO } from '../mappers.js';

export interface CreateProjectInput {
  name: string;
  userId: string;
  areaId?: string;
}

export class CreateProject {
  constructor(
    private readonly projectRepo: ProjectRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: CreateProjectInput): Promise<Result<ProjectDTO, string>> {
    const result = Project.create(input.name, input.userId, input.areaId ?? null);
    if (result.isErr) return Result.fail(result.error);

    const project = result.value;
    await this.projectRepo.save(project);
    await this.eventBus.publish(project.domainEvents);
    project.clearDomainEvents();

    return Result.ok(toProjectDTO(project));
  }
}
