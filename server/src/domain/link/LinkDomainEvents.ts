import type { DomainEvent } from '../shared/index.js';
import { UniqueId } from '../shared/index.js';
import type { LinkType } from '@kairos/shared';

export class LinkCreated implements DomainEvent {
  readonly eventId = new UniqueId().value;
  readonly occurredOn = new Date();
  readonly eventName = 'link.created';
  constructor(
    public readonly linkId: string,
    public readonly sourceId: string,
    public readonly targetId: string,
    public readonly linkType: LinkType,
  ) {}
}

export class LinkDeleted implements DomainEvent {
  readonly eventId = new UniqueId().value;
  readonly occurredOn = new Date();
  readonly eventName = 'link.deleted';
  constructor(public readonly linkId: string) {}
}
