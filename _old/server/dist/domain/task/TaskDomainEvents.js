import { UniqueId } from "../shared/index.js";
export class TaskCreated {
    taskId;
    title;
    userId;
    eventId = new UniqueId().value;
    occurredOn = new Date();
    eventName = "task.created";
    constructor(taskId, title, userId) {
        this.taskId = taskId;
        this.title = title;
        this.userId = userId;
    }
}
export class TaskCompleted {
    taskId;
    eventId = new UniqueId().value;
    occurredOn = new Date();
    eventName = "task.completed";
    constructor(taskId) {
        this.taskId = taskId;
    }
}
export class TaskReopened {
    taskId;
    eventId = new UniqueId().value;
    occurredOn = new Date();
    eventName = "task.reopened";
    constructor(taskId) {
        this.taskId = taskId;
    }
}
export class TaskUpdated {
    taskId;
    eventId = new UniqueId().value;
    occurredOn = new Date();
    eventName = "task.updated";
    constructor(taskId) {
        this.taskId = taskId;
    }
}
export class TaskAssignedToProject {
    taskId;
    projectId;
    eventId = new UniqueId().value;
    occurredOn = new Date();
    eventName = "task.assigned_to_project";
    constructor(taskId, projectId) {
        this.taskId = taskId;
        this.projectId = projectId;
    }
}
export class TaskAssignedToArea {
    taskId;
    areaId;
    eventId = new UniqueId().value;
    occurredOn = new Date();
    eventName = "task.assigned_to_area";
    constructor(taskId, areaId) {
        this.taskId = taskId;
        this.areaId = areaId;
    }
}
export class TaskMovedToInbox {
    taskId;
    eventId = new UniqueId().value;
    occurredOn = new Date();
    eventName = "task.moved_to_inbox";
    constructor(taskId) {
        this.taskId = taskId;
    }
}
export class SubtaskAdded {
    parentTaskId;
    subtaskId;
    eventId = new UniqueId().value;
    occurredOn = new Date();
    eventName = "task.subtask_added";
    constructor(parentTaskId, subtaskId) {
        this.parentTaskId = parentTaskId;
        this.subtaskId = subtaskId;
    }
}
//# sourceMappingURL=TaskDomainEvents.js.map