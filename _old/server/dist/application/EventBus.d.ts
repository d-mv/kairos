import type { DomainEvent } from "../domain/shared/index.js";
export interface EventBus {
    publish(events: ReadonlyArray<DomainEvent>): Promise<void>;
}
export declare class NoOpEventBus implements EventBus {
    publish(_events: ReadonlyArray<DomainEvent>): Promise<void>;
}
//# sourceMappingURL=EventBus.d.ts.map