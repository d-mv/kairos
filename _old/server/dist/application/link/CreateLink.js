import { Link } from "../../domain/link/index.js";
import { Result } from "../../domain/shared/index.js";
import { toLinkDTO } from "../mappers.js";
export class CreateLink {
    linkRepo;
    eventBus;
    constructor(linkRepo, eventBus) {
        this.linkRepo = linkRepo;
        this.eventBus = eventBus;
    }
    async execute(input) {
        const result = Link.createWithInverse(input.sourceId, input.sourceType, input.targetId, input.targetType, input.linkType, input.userId);
        if (result.isErr)
            return Result.fail(result.error);
        const [forward, inverse] = result.value;
        await this.linkRepo.save(forward);
        await this.linkRepo.save(inverse);
        const allEvents = [...forward.domainEvents, ...inverse.domainEvents];
        await this.eventBus.publish(allEvents);
        return Result.ok([toLinkDTO(forward), toLinkDTO(inverse)]);
    }
}
//# sourceMappingURL=CreateLink.js.map