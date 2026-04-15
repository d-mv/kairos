import { Entity, UniqueId, Result } from "../shared/index.js";
import { AreaCreated, AreaRenamed } from "./AreaDomainEvents.js";
export class Area extends Entity {
    constructor(props, id) {
        super(props, id);
    }
    static create(name, userId, id) {
        const trimmed = name.trim();
        if (trimmed.length === 0) {
            return Result.fail("Area name cannot be empty");
        }
        const area = new Area({ name: trimmed, userId, createdAt: new Date(), updatedAt: new Date() }, id ? new UniqueId(id) : undefined);
        area.addDomainEvent(new AreaCreated(area.id, trimmed, userId));
        return Result.ok(area);
    }
    static reconstitute(id, props) {
        return new Area(props, new UniqueId(id));
    }
    get name() {
        return this.props.name;
    }
    get userId() {
        return this.props.userId;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    rename(newName) {
        const trimmed = newName.trim();
        if (trimmed.length === 0) {
            return Result.fail("Area name cannot be empty");
        }
        const oldName = this.props.name;
        this.props.name = trimmed;
        this.props.updatedAt = new Date();
        this.addDomainEvent(new AreaRenamed(this.id, oldName, trimmed));
        return Result.ok(undefined);
    }
}
//# sourceMappingURL=Area.js.map