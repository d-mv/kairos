import { Result } from "../../domain/shared/index.js";
import { toAreaDTO } from "../mappers.js";
export class UpdateArea {
    areaRepo;
    eventBus;
    constructor(areaRepo, eventBus) {
        this.areaRepo = areaRepo;
        this.eventBus = eventBus;
    }
    async execute(input) {
        const area = await this.areaRepo.findById(input.id, input.userId);
        if (!area)
            return Result.fail("Area not found");
        const result = area.rename(input.name);
        if (result.isErr)
            return Result.fail(result.error);
        await this.areaRepo.save(area);
        await this.eventBus.publish(area.domainEvents);
        area.clearDomainEvents();
        return Result.ok(toAreaDTO(area));
    }
}
//# sourceMappingURL=UpdateArea.js.map