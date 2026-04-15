import { Entity, Result, UniqueId } from "../shared/index.js";
export class BrainFolder extends Entity {
    constructor(props, id) {
        super(props, id);
    }
    static create(name, userId, id) {
        const trimmed = name.trim();
        if (trimmed.length === 0)
            return Result.fail("Folder name cannot be empty");
        return Result.ok(new BrainFolder({ name: trimmed, userId, createdAt: new Date(), updatedAt: new Date() }, id ? new UniqueId(id) : undefined));
    }
    static reconstitute(id, props) {
        return new BrainFolder(props, new UniqueId(id));
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
    rename(name) {
        const trimmed = name.trim();
        if (trimmed.length === 0)
            return Result.fail("Folder name cannot be empty");
        this.props.name = trimmed;
        this.props.updatedAt = new Date();
        return Result.ok(undefined);
    }
}
//# sourceMappingURL=BrainFolder.js.map