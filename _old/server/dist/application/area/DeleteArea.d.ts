import type { AreaRepository } from "../../domain/area/index.js";
import type { ProjectRepository } from "../../domain/project/index.js";
import { Result } from "../../domain/shared/index.js";
import type { TaskRepository } from "../../domain/task/index.js";
import type { EventBus } from "../EventBus.js";
export interface DeleteAreaInput {
    id: string;
    userId: string;
}
export declare class DeleteArea {
    private readonly areaRepo;
    private readonly projectRepo;
    private readonly taskRepo;
    private readonly eventBus;
    constructor(areaRepo: AreaRepository, projectRepo: ProjectRepository, taskRepo: TaskRepository, eventBus: EventBus);
    execute(input: DeleteAreaInput): Promise<Result<void, string>>;
}
//# sourceMappingURL=DeleteArea.d.ts.map