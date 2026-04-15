import { LinkDeleted } from "../../domain/link/index.js";
import { Result } from "../../domain/shared/index.js";
export class DeleteLink {
    linkRepo;
    eventBus;
    constructor(linkRepo, eventBus) {
        this.linkRepo = linkRepo;
        this.eventBus = eventBus;
    }
    async execute(id, userId) {
        const link = await this.linkRepo.findById(id, userId);
        if (!link)
            return Result.fail("Link not found");
        await this.linkRepo.delete(id, userId);
        await this.eventBus.publish([new LinkDeleted(id)]);
        return Result.ok(undefined);
    }
}
//# sourceMappingURL=DeleteLink.js.map