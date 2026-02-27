import type { DomainEvent } from "../shared/index.js";
import { UniqueId } from "../shared/index.js";

export class ProjectCreated implements DomainEvent {
  readonly eventId = new UniqueId().value;
  readonly occurredOn = new Date();
  readonly eventName = "project.created";
  constructor(
    public readonly projectId: string,
    public readonly name: string,
    public readonly areaId: string | null,
    public readonly userId: string,
  ) {}
}

export class ProjectRenamed implements DomainEvent {
  readonly eventId = new UniqueId().value;
  readonly occurredOn = new Date();
  readonly eventName = "project.renamed";
  constructor(
    public readonly projectId: string,
    public readonly oldName: string,
    public readonly newName: string,
  ) {}
}

export class ProjectMovedToArea implements DomainEvent {
  readonly eventId = new UniqueId().value;
  readonly occurredOn = new Date();
  readonly eventName = "project.moved_to_area";
  constructor(
    public readonly projectId: string,
    public readonly areaId: string | null,
  ) {}
}

export class ProjectDeleted implements DomainEvent {
  readonly eventId = new UniqueId().value;
  readonly occurredOn = new Date();
  readonly eventName = "project.deleted";
  constructor(public readonly projectId: string) {}
}
