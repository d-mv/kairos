import type { LinkRepository } from "../../domain/link/index.js";
import { Result } from "../../domain/shared/index.js";
import type { EventBus } from "../EventBus.js";
export declare class DeleteLink {
    private readonly linkRepo;
    private readonly eventBus;
    constructor(linkRepo: LinkRepository, eventBus: EventBus);
    execute(id: string, userId: string): Promise<Result<void, string>>;
}
//# sourceMappingURL=DeleteLink.d.ts.map