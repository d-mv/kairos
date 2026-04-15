import type { ProjectDTO } from "@kairos/shared";
import type { TaskRepository } from "../../domain/task/index.js";
import type { ProjectRepository } from "../../domain/project/index.js";
import { Result } from "../../domain/shared/index.js";
import type { EventBus } from "../EventBus.js";
export declare class PromoteTask {
    private readonly taskRepo;
    private readonly projectRepo;
    private readonly eventBus;
    constructor(taskRepo: TaskRepository, projectRepo: ProjectRepository, eventBus: EventBus);
    execute(taskId: string, userId: string): Promise<Result<ProjectDTO, string>>;
}
//# sourceMappingURL=PromoteTask.d.ts.map