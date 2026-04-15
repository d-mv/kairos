import { UniqueId } from "../shared/index.js";
export class LinkCreated {
    linkId;
    sourceId;
    targetId;
    linkType;
    eventId = new UniqueId().value;
    occurredOn = new Date();
    eventName = "link.created";
    constructor(linkId, sourceId, targetId, linkType) {
        this.linkId = linkId;
        this.sourceId = sourceId;
        this.targetId = targetId;
        this.linkType = linkType;
    }
}
export class LinkDeleted {
    linkId;
    eventId = new UniqueId().value;
    occurredOn = new Date();
    eventName = "link.deleted";
    constructor(linkId) {
        this.linkId = linkId;
    }
}
//# sourceMappingURL=LinkDomainEvents.js.map