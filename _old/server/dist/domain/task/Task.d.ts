import type { TaskStatus, TaskPriority, TaskDurationUnit } from "@kairos/shared";
import { Entity, Result } from "../shared/index.js";
interface TaskProps {
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    parentTaskId: string | null;
    projectId: string | null;
    areaId: string | null;
    userId: string;
    dueDate: Date | null;
    duration: number | null;
    durationUnit: TaskDurationUnit | null;
    tags: string[];
    position: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare class Task extends Entity<TaskProps> {
    private constructor();
    static create(title: string, userId: string, opts?: {
        description?: string;
        priority?: TaskPriority;
        projectId?: string;
        areaId?: string;
        parentTaskId?: string;
        dueDate?: Date;
        duration?: number;
        durationUnit?: TaskDurationUnit;
        tags?: string[];
        id?: string;
    }): Result<Task, string>;
    static reconstitute(id: string, props: TaskProps): Task;
    get title(): string;
    get description(): string | null;
    get status(): TaskStatus;
    get priority(): TaskPriority;
    get parentTaskId(): string | null;
    get projectId(): string | null;
    get areaId(): string | null;
    get userId(): string;
    get dueDate(): Date | null;
    get duration(): number | null;
    get durationUnit(): TaskDurationUnit | null;
    get tags(): string[];
    get position(): number;
    get createdAt(): Date;
    get updatedAt(): Date;
    isSubtask(): boolean;
    isInInbox(): boolean;
    complete(): Result<void, string>;
    reopen(): Result<void, string>;
    updateTitle(title: string): Result<void, string>;
    updateDescription(description: string | null): void;
    updatePriority(priority: TaskPriority): void;
    updateDueDate(dueDate: Date | null): void;
    updateDuration(duration: number | null, durationUnit: TaskDurationUnit | null): Result<void, string>;
    updateTags(tags: string[]): void;
    assignToProject(projectId: string): Result<void, string>;
    assignToArea(areaId: string): Result<void, string>;
    moveToInbox(): Result<void, string>;
    setPosition(position: number): void;
    /**
     * Validates that this task CAN be a parent (i.e. it is not itself a subtask).
     * The actual subtask creation is done via Task.create() with parentTaskId.
     * This method is used by the application layer before persisting.
     */
    canHaveSubtask(): Result<void, string>;
}
export {};
//# sourceMappingURL=Task.d.ts.map