import type { DomainEvent } from './DomainEvent.js';
import { UniqueId } from './UniqueId.js';

export abstract class Entity<T> {
  protected readonly _id: UniqueId;
  protected readonly props: T;
  private _domainEvents: DomainEvent[] = [];

  constructor(props: T, id?: UniqueId) {
    this._id = id ?? new UniqueId();
    this.props = props;
  }

  get id(): string {
    return this._id.value;
  }

  get domainEvents(): ReadonlyArray<DomainEvent> {
    return this._domainEvents;
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  clearDomainEvents(): void {
    this._domainEvents = [];
  }

  equals(other?: Entity<T>): boolean {
    if (other == null) return false;
    if (other.constructor !== this.constructor) return false;
    return this._id.equals(other._id);
  }
}
