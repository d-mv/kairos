import type { TaskDTO } from "@kairos/shared";
import { Result } from "../../domain/shared/index.js";
import type { TaskRepository } from "../../domain/task/index.js";
import type { EventBus } from "../EventBus.js";
export declare class ReopenTask {
    private readonly taskRepo;
    private readonly eventBus;
    constructor(taskRepo: TaskRepository, eventBus: EventBus);
    execute(id: string, userId: string): Promise<Result<TaskDTO, string>>;
}
//# sourceMappingURL=ReopenTask.d.ts.map