import type { DomainEvent } from "./DomainEvent.js";
import { UniqueId } from "./UniqueId.js";
export declare abstract class Entity<T> {
    protected readonly _id: UniqueId;
    protected readonly props: T;
    private _domainEvents;
    constructor(props: T, id?: UniqueId);
    get id(): string;
    get domainEvents(): ReadonlyArray<DomainEvent>;
    protected addDomainEvent(event: DomainEvent): void;
    clearDomainEvents(): void;
    equals(other?: Entity<T>): boolean;
}
//# sourceMappingURL=Entity.d.ts.map