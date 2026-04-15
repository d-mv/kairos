import type { TaskDTO } from "@kairos/shared";
import type { TaskRepository } from "../../domain/task/index.js";
import { Result } from "../../domain/shared/index.js";
import type { EventBus } from "../EventBus.js";
export interface ReorderTaskInput {
    taskId: string;
    /** The task after which to insert. null = move to the very beginning of the list. */
    afterId: string | null;
    userId: string;
}
export declare class ReorderTask {
    private readonly taskRepo;
    private readonly eventBus;
    constructor(taskRepo: TaskRepository, eventBus: EventBus);
    execute(input: ReorderTaskInput): Promise<Result<TaskDTO, string>>;
    private calcPosition;
}
//# sourceMappingURL=ReorderTask.d.ts.map