import type { ProjectDTO } from "@kairos/shared";
import type { ProjectRepository } from "../../domain/project/index.js";
import { Result } from "../../domain/shared/index.js";
import type { EventBus } from "../EventBus.js";
import { toProjectDTO } from "../mappers.js";

export interface UpdateProjectInput {
  id: string;
  userId: string;
  name?: string;
  areaId?: string | null;
  completedAt?: string | null;
}

export class UpdateProject {
  constructor(
    private readonly projectRepo: ProjectRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: UpdateProjectInput): Promise<Result<ProjectDTO, string>> {
    const project = await this.projectRepo.findById(input.id, input.userId);
    if (!project) return Result.fail("Project not found");

    if (input.name !== undefined) {
      const result = project.rename(input.name);
      if (result.isErr) return Result.fail(result.error);
    }

    if ("areaId" in input) {
      project.moveToArea(input.areaId ?? null);
    }

    if ("completedAt" in input) {
      if (input.completedAt) {
        project.complete(new Date(input.completedAt));
      } else {
        project.reopen();
      }
    }

    await this.projectRepo.save(project);
    await this.eventBus.publish(project.domainEvents);
    project.clearDomainEvents();

    return Result.ok(toProjectDTO(project));
  }
}
