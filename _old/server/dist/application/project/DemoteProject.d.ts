import type { TaskDTO } from "@kairos/shared";
import type { TaskRepository } from "../../domain/task/index.js";
import type { ProjectRepository } from "../../domain/project/index.js";
import { Result } from "../../domain/shared/index.js";
import type { EventBus } from "../EventBus.js";
export declare class DemoteProject {
    private readonly taskRepo;
    private readonly projectRepo;
    private readonly eventBus;
    constructor(taskRepo: TaskRepository, projectRepo: ProjectRepository, eventBus: EventBus);
    execute(projectId: string, userId: string): Promise<Result<TaskDTO, string>>;
}
//# sourceMappingURL=DemoteProject.d.ts.map