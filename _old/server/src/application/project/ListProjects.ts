import type { ProjectDTO } from "@kairos/shared";
import type { ProjectRepository } from "../../domain/project/index.js";
import { Result } from "../../domain/shared/index.js";
import { toProjectDTO } from "../mappers.js";

export class ListProjects {
  constructor(private readonly projectRepo: ProjectRepository) {}

  async execute(userId: string): Promise<Result<ProjectDTO[], string>> {
    const projects = await this.projectRepo.findAll(userId);
    return Result.ok(projects.map(toProjectDTO));
  }
}
