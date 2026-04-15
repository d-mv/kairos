import { Entity, UniqueId, Result } from "../shared/index.js";
import { LinkCreated } from "./LinkDomainEvents.js";
const INVERSE = {
    blocks: "blocked_by",
    blocked_by: "blocks",
    related_to: "related_to",
};
export class Link extends Entity {
    constructor(props, id) {
        super(props, id);
    }
    static create(sourceId, sourceType, targetId, targetType, linkType, userId, id) {
        if (sourceId === targetId) {
            return Result.fail("A link cannot connect an entity to itself");
        }
        const link = new Link({ sourceId, sourceType, targetId, targetType, linkType, userId, createdAt: new Date() }, id ? new UniqueId(id) : undefined);
        link.addDomainEvent(new LinkCreated(link.id, sourceId, targetId, linkType));
        return Result.ok(link);
    }
    static reconstitute(id, props) {
        return new Link(props, new UniqueId(id));
    }
    get sourceId() {
        return this.props.sourceId;
    }
    get sourceType() {
        return this.props.sourceType;
    }
    get targetId() {
        return this.props.targetId;
    }
    get targetType() {
        return this.props.targetType;
    }
    get linkType() {
        return this.props.linkType;
    }
    get userId() {
        return this.props.userId;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    /**
     * Creates a pair [forward, inverse] for a given link.
     * e.g. blocks → [blocks, blocked_by]
     */
    static createWithInverse(sourceId, sourceType, targetId, targetType, linkType, userId) {
        const forwardResult = Link.create(sourceId, sourceType, targetId, targetType, linkType, userId);
        if (forwardResult.isErr)
            return Result.fail(forwardResult.error);
        const inverseLinkType = INVERSE[linkType];
        const inverseResult = Link.create(targetId, targetType, sourceId, sourceType, inverseLinkType, userId);
        if (inverseResult.isErr)
            return Result.fail(inverseResult.error);
        return Result.ok([forwardResult.value, inverseResult.value]);
    }
}
//# sourceMappingURL=Link.js.map