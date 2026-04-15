import type { TaskDTO, TaskPriority, TaskDurationUnit } from "@kairos/shared";
import type { TaskRepository } from "../../domain/task/index.js";
import { Result } from "../../domain/shared/index.js";
import type { EventBus } from "../EventBus.js";
export interface UpdateTaskInput {
    id: string;
    userId: string;
    title?: string;
    description?: string | null;
    priority?: TaskPriority;
    projectId?: string | null;
    areaId?: string | null;
    dueDate?: string | null;
    duration?: number | null;
    durationUnit?: TaskDurationUnit | null;
    tags?: string[];
}
export declare class UpdateTask {
    private readonly taskRepo;
    private readonly eventBus;
    private readonly normalizeTitle;
    constructor(taskRepo: TaskRepository, eventBus: EventBus, normalizeTitle?: (title: string) => Promise<string>);
    execute(input: UpdateTaskInput): Promise<Result<TaskDTO, string>>;
}
//# sourceMappingURL=UpdateTask.d.ts.map