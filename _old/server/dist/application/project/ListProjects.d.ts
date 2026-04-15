import type { ProjectDTO } from "@kairos/shared";
import type { ProjectRepository } from "../../domain/project/index.js";
import { Result } from "../../domain/shared/index.js";
export declare class ListProjects {
    private readonly projectRepo;
    constructor(projectRepo: ProjectRepository);
    execute(userId: string): Promise<Result<ProjectDTO[], string>>;
}
//# sourceMappingURL=ListProjects.d.ts.map