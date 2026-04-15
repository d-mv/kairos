import type { DomainEvent } from "../shared/index.js";
export declare class TaskCreated implements DomainEvent {
    readonly taskId: string;
    readonly title: string;
    readonly userId: string;
    readonly eventId: string;
    readonly occurredOn: Date;
    readonly eventName = "task.created";
    constructor(taskId: string, title: string, userId: string);
}
export declare class TaskCompleted implements DomainEvent {
    readonly taskId: string;
    readonly eventId: string;
    readonly occurredOn: Date;
    readonly eventName = "task.completed";
    constructor(taskId: string);
}
export declare class TaskReopened implements DomainEvent {
    readonly taskId: string;
    readonly eventId: string;
    readonly occurredOn: Date;
    readonly eventName = "task.reopened";
    constructor(taskId: string);
}
export declare class TaskUpdated implements DomainEvent {
    readonly taskId: string;
    readonly eventId: string;
    readonly occurredOn: Date;
    readonly eventName = "task.updated";
    constructor(taskId: string);
}
export declare class TaskAssignedToProject implements DomainEvent {
    readonly taskId: string;
    readonly projectId: string;
    readonly eventId: string;
    readonly occurredOn: Date;
    readonly eventName = "task.assigned_to_project";
    constructor(taskId: string, projectId: string);
}
export declare class TaskAssignedToArea implements DomainEvent {
    readonly taskId: string;
    readonly areaId: string;
    readonly eventId: string;
    readonly occurredOn: Date;
    readonly eventName = "task.assigned_to_area";
    constructor(taskId: string, areaId: string);
}
export declare class TaskMovedToInbox implements DomainEvent {
    readonly taskId: string;
    readonly eventId: string;
    readonly occurredOn: Date;
    readonly eventName = "task.moved_to_inbox";
    constructor(taskId: string);
}
export declare class SubtaskAdded implements DomainEvent {
    readonly parentTaskId: string;
    readonly subtaskId: string;
    readonly eventId: string;
    readonly occurredOn: Date;
    readonly eventName = "task.subtask_added";
    constructor(parentTaskId: string, subtaskId: string);
}
//# sourceMappingURL=TaskDomainEvents.d.ts.map