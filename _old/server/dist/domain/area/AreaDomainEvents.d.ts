import type { DomainEvent } from "../shared/index.js";
export declare class AreaCreated implements DomainEvent {
    readonly areaId: string;
    readonly name: string;
    readonly userId: string;
    readonly eventId: string;
    readonly occurredOn: Date;
    readonly eventName = "area.created";
    constructor(areaId: string, name: string, userId: string);
}
export declare class AreaRenamed implements DomainEvent {
    readonly areaId: string;
    readonly oldName: string;
    readonly newName: string;
    readonly eventId: string;
    readonly occurredOn: Date;
    readonly eventName = "area.renamed";
    constructor(areaId: string, oldName: string, newName: string);
}
export declare class AreaDeleted implements DomainEvent {
    readonly areaId: string;
    readonly eventId: string;
    readonly occurredOn: Date;
    readonly eventName = "area.deleted";
    constructor(areaId: string);
}
//# sourceMappingURL=AreaDomainEvents.d.ts.map