import type { TaskDTO } from "@kairos/shared";
import type { TaskRepository } from "../../domain/task/index.js";
import { Result } from "../../domain/shared/index.js";
export interface ListTasksInput {
    userId: string;
    projectId?: string;
    areaId?: string;
    inbox?: boolean;
    parentTaskId?: string;
}
export declare class ListTasks {
    private readonly taskRepo;
    constructor(taskRepo: TaskRepository);
    execute(input: ListTasksInput): Promise<Result<TaskDTO[], string>>;
}
//# sourceMappingURL=ListTasks.d.ts.map