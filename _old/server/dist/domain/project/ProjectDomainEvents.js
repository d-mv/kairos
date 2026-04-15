import { UniqueId } from "../shared/index.js";
export class ProjectCreated {
    projectId;
    name;
    areaId;
    userId;
    eventId = new UniqueId().value;
    occurredOn = new Date();
    eventName = "project.created";
    constructor(projectId, name, areaId, userId) {
        this.projectId = projectId;
        this.name = name;
        this.areaId = areaId;
        this.userId = userId;
    }
}
export class ProjectRenamed {
    projectId;
    oldName;
    newName;
    eventId = new UniqueId().value;
    occurredOn = new Date();
    eventName = "project.renamed";
    constructor(projectId, oldName, newName) {
        this.projectId = projectId;
        this.oldName = oldName;
        this.newName = newName;
    }
}
export class ProjectMovedToArea {
    projectId;
    areaId;
    eventId = new UniqueId().value;
    occurredOn = new Date();
    eventName = "project.moved_to_area";
    constructor(projectId, areaId) {
        this.projectId = projectId;
        this.areaId = areaId;
    }
}
export class ProjectDeleted {
    projectId;
    eventId = new UniqueId().value;
    occurredOn = new Date();
    eventName = "project.deleted";
    constructor(projectId) {
        this.projectId = projectId;
    }
}
export class ProjectCompleted {
    projectId;
    eventId = new UniqueId().value;
    occurredOn = new Date();
    eventName = "project.completed";
    constructor(projectId) {
        this.projectId = projectId;
    }
}
export class ProjectReopened {
    projectId;
    eventId = new UniqueId().value;
    occurredOn = new Date();
    eventName = "project.reopened";
    constructor(projectId) {
        this.projectId = projectId;
    }
}
//# sourceMappingURL=ProjectDomainEvents.js.map