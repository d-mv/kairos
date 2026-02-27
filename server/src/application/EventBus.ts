import type { DomainEvent } from "../domain/shared/index.js";

export interface EventBus {
  publish(events: ReadonlyArray<DomainEvent>): Promise<void>;
}

export class NoOpEventBus implements EventBus {
  async publish(_events: ReadonlyArray<DomainEvent>): Promise<void> {}
}
