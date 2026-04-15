import type { ProjectDTO } from "@kairos/shared";
import type { ProjectRepository } from "../../domain/project/index.js";
import { Result } from "../../domain/shared/index.js";
import type { EventBus } from "../EventBus.js";
export interface UpdateProjectInput {
    id: string;
    userId: string;
    name?: string;
    areaId?: string | null;
    completedAt?: string | null;
}
export declare class UpdateProject {
    private readonly projectRepo;
    private readonly eventBus;
    constructor(projectRepo: ProjectRepository, eventBus: EventBus);
    execute(input: UpdateProjectInput): Promise<Result<ProjectDTO, string>>;
}
//# sourceMappingURL=UpdateProject.d.ts.map