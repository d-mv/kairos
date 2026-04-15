import type { LinkDTO, LinkType, EntityType } from "@kairos/shared";
import type { LinkRepository } from "../../domain/link/index.js";
import { Result } from "../../domain/shared/index.js";
import type { EventBus } from "../EventBus.js";
export interface CreateLinkInput {
    sourceId: string;
    sourceType: EntityType;
    targetId: string;
    targetType: EntityType;
    linkType: LinkType;
    userId: string;
}
export declare class CreateLink {
    private readonly linkRepo;
    private readonly eventBus;
    constructor(linkRepo: LinkRepository, eventBus: EventBus);
    execute(input: CreateLinkInput): Promise<Result<LinkDTO[], string>>;
}
//# sourceMappingURL=CreateLink.d.ts.map