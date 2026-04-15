import type { DomainEvent } from "../shared/index.js";
import { UniqueId } from "../shared/index.js";

export class TaskCreated implements DomainEvent {
  readonly eventId = new UniqueId().value;
  readonly occurredOn = new Date();
  readonly eventName = "task.created";
  constructor(
    public readonly taskId: string,
    public readonly title: string,
    public readonly userId: string,
  ) {}
}

export class TaskCompleted implements DomainEvent {
  readonly eventId = new UniqueId().value;
  readonly occurredOn = new Date();
  readonly eventName = "task.completed";
  constructor(public readonly taskId: string) {}
}

export class TaskReopened implements DomainEvent {
  readonly eventId = new UniqueId().value;
  readonly occurredOn = new Date();
  readonly eventName = "task.reopened";
  constructor(public readonly taskId: string) {}
}

export class TaskUpdated implements DomainEvent {
  readonly eventId = new UniqueId().value;
  readonly occurredOn = new Date();
  readonly eventName = "task.updated";
  constructor(public readonly taskId: string) {}
}

export class TaskAssignedToProject implements DomainEvent {
  readonly eventId = new UniqueId().value;
  readonly occurredOn = new Date();
  readonly eventName = "task.assigned_to_project";
  constructor(
    public readonly taskId: string,
    public readonly projectId: string,
  ) {}
}

export class TaskAssignedToArea implements DomainEvent {
  readonly eventId = new UniqueId().value;
  readonly occurredOn = new Date();
  readonly eventName = "task.assigned_to_area";
  constructor(
    public readonly taskId: string,
    public readonly areaId: string,
  ) {}
}

export class TaskMovedToInbox implements DomainEvent {
  readonly eventId = new UniqueId().value;
  readonly occurredOn = new Date();
  readonly eventName = "task.moved_to_inbox";
  constructor(public readonly taskId: string) {}
}

export class SubtaskAdded implements DomainEvent {
  readonly eventId = new UniqueId().value;
  readonly occurredOn = new Date();
  readonly eventName = "task.subtask_added";
  constructor(
    public readonly parentTaskId: string,
    public readonly subtaskId: string,
  ) {}
}
