import type { DomainEvent } from "../shared/index.js";
export declare class ProjectCreated implements DomainEvent {
    readonly projectId: string;
    readonly name: string;
    readonly areaId: string | null;
    readonly userId: string;
    readonly eventId: string;
    readonly occurredOn: Date;
    readonly eventName = "project.created";
    constructor(projectId: string, name: string, areaId: string | null, userId: string);
}
export declare class ProjectRenamed implements DomainEvent {
    readonly projectId: string;
    readonly oldName: string;
    readonly newName: string;
    readonly eventId: string;
    readonly occurredOn: Date;
    readonly eventName = "project.renamed";
    constructor(projectId: string, oldName: string, newName: string);
}
export declare class ProjectMovedToArea implements DomainEvent {
    readonly projectId: string;
    readonly areaId: string | null;
    readonly eventId: string;
    readonly occurredOn: Date;
    readonly eventName = "project.moved_to_area";
    constructor(projectId: string, areaId: string | null);
}
export declare class ProjectDeleted implements DomainEvent {
    readonly projectId: string;
    readonly eventId: string;
    readonly occurredOn: Date;
    readonly eventName = "project.deleted";
    constructor(projectId: string);
}
export declare class ProjectCompleted implements DomainEvent {
    readonly projectId: string;
    readonly eventId: string;
    readonly occurredOn: Date;
    readonly eventName = "project.completed";
    constructor(projectId: string);
}
export declare class ProjectReopened implements DomainEvent {
    readonly projectId: string;
    readonly eventId: string;
    readonly occurredOn: Date;
    readonly eventName = "project.reopened";
    constructor(projectId: string);
}
//# sourceMappingURL=ProjectDomainEvents.d.ts.map