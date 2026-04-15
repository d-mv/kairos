import type { ProjectDTO } from "@kairos/shared";
import type { ProjectRepository } from "../../domain/project/index.js";
import { Result } from "../../domain/shared/index.js";
import type { EventBus } from "../EventBus.js";
export interface CreateProjectInput {
    name: string;
    userId: string;
    areaId?: string;
}
export declare class CreateProject {
    private readonly projectRepo;
    private readonly eventBus;
    constructor(projectRepo: ProjectRepository, eventBus: EventBus);
    execute(input: CreateProjectInput): Promise<Result<ProjectDTO, string>>;
}
//# sourceMappingURL=CreateProject.d.ts.map