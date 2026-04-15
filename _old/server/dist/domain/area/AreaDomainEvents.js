import { UniqueId } from "../shared/index.js";
export class AreaCreated {
    areaId;
    name;
    userId;
    eventId = new UniqueId().value;
    occurredOn = new Date();
    eventName = "area.created";
    constructor(areaId, name, userId) {
        this.areaId = areaId;
        this.name = name;
        this.userId = userId;
    }
}
export class AreaRenamed {
    areaId;
    oldName;
    newName;
    eventId = new UniqueId().value;
    occurredOn = new Date();
    eventName = "area.renamed";
    constructor(areaId, oldName, newName) {
        this.areaId = areaId;
        this.oldName = oldName;
        this.newName = newName;
    }
}
export class AreaDeleted {
    areaId;
    eventId = new UniqueId().value;
    occurredOn = new Date();
    eventName = "area.deleted";
    constructor(areaId) {
        this.areaId = areaId;
    }
}
//# sourceMappingURL=AreaDomainEvents.js.map