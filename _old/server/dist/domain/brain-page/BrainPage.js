import { Entity, Result, UniqueId } from "../shared/index.js";
export class BrainPage extends Entity {
    constructor(props, id) {
        super(props, id);
    }
    static create(title, userId, options, id) {
        const trimmed = title.trim();
        if (trimmed.length === 0)
            return Result.fail("Page title cannot be empty");
        return Result.ok(new BrainPage({
            title: trimmed,
            folderId: options?.folderId ?? null,
            contentJson: options?.contentJson ?? {},
            userId,
            createdAt: new Date(),
            updatedAt: new Date(),
        }, id ? new UniqueId(id) : undefined));
    }
    static reconstitute(id, props) {
        return new BrainPage(props, new UniqueId(id));
    }
    get title() {
        return this.props.title;
    }
    get folderId() {
        return this.props.folderId;
    }
    get contentJson() {
        return this.props.contentJson;
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
    update(data) {
        if (data.title !== undefined) {
            const trimmed = data.title.trim();
            if (trimmed.length === 0)
                return Result.fail("Page title cannot be empty");
            this.props.title = trimmed;
        }
        if (data.folderId !== undefined) {
            this.props.folderId = data.folderId;
        }
        if (data.contentJson !== undefined) {
            this.props.contentJson = data.contentJson;
        }
        this.props.updatedAt = new Date();
        return Result.ok(undefined);
    }
}
//# sourceMappingURL=BrainPage.js.map