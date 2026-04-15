import type { TaskDTO, TaskPriority, TaskDurationUnit } from "@kairos/shared";
import type { ProjectRepository } from "../../domain/project/index.js";
import type { TaskRepository } from "../../domain/task/index.js";
import { Result } from "../../domain/shared/index.js";
import type { EventBus } from "../EventBus.js";
export interface CreateTaskInput {
    title: string;
    userId: string;
    description?: string;
    priority?: TaskPriority;
    projectId?: string;
    areaId?: string;
    parentTaskId?: string;
    dueDate?: string;
    duration?: number;
    durationUnit?: TaskDurationUnit;
    tags?: string[];
}
export declare class CreateTask {
    private readonly taskRepo;
    private readonly eventBus;
    private readonly normalizeTitle;
    private readonly projectRepo?;
    constructor(taskRepo: TaskRepository, eventBus: EventBus, normalizeTitle?: (title: string) => Promise<string>, projectRepo?: ProjectRepository | undefined);
    execute(input: CreateTaskInput): Promise<Result<TaskDTO, string>>;
}
//# sourceMappingURL=CreateTask.d.ts.map