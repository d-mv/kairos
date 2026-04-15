import type { DomainEvent } from "../shared/index.js";
import type { LinkType } from "@kairos/shared";
export declare class LinkCreated implements DomainEvent {
    readonly linkId: string;
    readonly sourceId: string;
    readonly targetId: string;
    readonly linkType: LinkType;
    readonly eventId: string;
    readonly occurredOn: Date;
    readonly eventName = "link.created";
    constructor(linkId: string, sourceId: string, targetId: string, linkType: LinkType);
}
export declare class LinkDeleted implements DomainEvent {
    readonly linkId: string;
    readonly eventId: string;
    readonly occurredOn: Date;
    readonly eventName = "link.deleted";
    constructor(linkId: string);
}
//# sourceMappingURL=LinkDomainEvents.d.ts.map