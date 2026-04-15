import type { TaskRepository } from "../../domain/task/index.js";
import { Result } from "../../domain/shared/index.js";
import type { EventBus } from "../EventBus.js";
export declare class DeleteTask {
    private readonly taskRepo;
    private readonly eventBus;
    constructor(taskRepo: TaskRepository, eventBus: EventBus);
    execute(id: string, userId: string): Promise<Result<void, string>>;
}
//# sourceMappingURL=DeleteTask.d.ts.map