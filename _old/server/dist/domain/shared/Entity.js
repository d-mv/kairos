import { UniqueId } from "./UniqueId.js";
export class Entity {
    _id;
    props;
    _domainEvents = [];
    constructor(props, id) {
        this._id = id ?? new UniqueId();
        this.props = props;
    }
    get id() {
        return this._id.value;
    }
    get domainEvents() {
        return this._domainEvents;
    }
    addDomainEvent(event) {
        this._domainEvents.push(event);
    }
    clearDomainEvents() {
        this._domainEvents = [];
    }
    equals(other) {
        if (other == null)
            return false;
        if (other.constructor !== this.constructor)
            return false;
        return this._id.equals(other._id);
    }
}
//# sourceMappingURL=Entity.js.map