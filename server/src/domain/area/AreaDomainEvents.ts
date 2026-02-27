import type { DomainEvent } from '../shared/index.js';
import { UniqueId } from '../shared/index.js';

export class AreaCreated implements DomainEvent {
  readonly eventId = new UniqueId().value;
  readonly occurredOn = new Date();
  readonly eventName = 'area.created';

  constructor(
    public readonly areaId: string,
    public readonly name: string,
    public readonly userId: string,
  ) {}
}

export class AreaRenamed implements DomainEvent {
  readonly eventId = new UniqueId().value;
  readonly occurredOn = new Date();
  readonly eventName = 'area.renamed';

  constructor(
    public readonly areaId: string,
    public readonly oldName: string,
    public readonly newName: string,
  ) {}
}

export class AreaDeleted implements DomainEvent {
  readonly eventId = new UniqueId().value;
  readonly occurredOn = new Date();
  readonly eventName = 'area.deleted';

  constructor(public readonly areaId: string) {}
}
