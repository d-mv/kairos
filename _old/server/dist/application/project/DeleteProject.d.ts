import type { ProjectRepository } from "../../domain/project/index.js";
import { Result } from "../../domain/shared/index.js";
import type { EventBus } from "../EventBus.js";
export declare class DeleteProject {
    private readonly projectRepo;
    private readonly eventBus;
    constructor(projectRepo: ProjectRepository, eventBus: EventBus);
    execute(id: string, userId: string): Promise<Result<void, string>>;
}
//# sourceMappingURL=DeleteProject.d.ts.map