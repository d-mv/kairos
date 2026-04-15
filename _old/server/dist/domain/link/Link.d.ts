import type { LinkType, EntityType } from "@kairos/shared";
import { Entity, Result } from "../shared/index.js";
interface LinkProps {
    sourceId: string;
    sourceType: EntityType;
    targetId: string;
    targetType: EntityType;
    linkType: LinkType;
    userId: string;
    createdAt: Date;
}
export declare class Link extends Entity<LinkProps> {
    private constructor();
    static create(sourceId: string, sourceType: EntityType, targetId: string, targetType: EntityType, linkType: LinkType, userId: string, id?: string): Result<Link, string>;
    static reconstitute(id: string, props: LinkProps): Link;
    get sourceId(): string;
    get sourceType(): EntityType;
    get targetId(): string;
    get targetType(): EntityType;
    get linkType(): LinkType;
    get userId(): string;
    get createdAt(): Date;
    /**
     * Creates a pair [forward, inverse] for a given link.
     * e.g. blocks → [blocks, blocked_by]
     */
    static createWithInverse(sourceId: string, sourceType: EntityType, targetId: string, targetType: EntityType, linkType: LinkType, userId: string): Result<[Link, Link], string>;
}
export {};
//# sourceMappingURL=Link.d.ts.map