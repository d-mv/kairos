import { Area } from "../../domain/area/index.js";
import { Result } from "../../domain/shared/index.js";
import { toAreaDTO } from "../mappers.js";
export class CreateArea {
    areaRepo;
    eventBus;
    constructor(areaRepo, eventBus) {
        this.areaRepo = areaRepo;
        this.eventBus = eventBus;
    }
    async execute(input) {
        const result = Area.create(input.name, input.userId);
        if (result.isErr)
            return Result.fail(result.error);
        const area = result.value;
        await this.areaRepo.save(area);
        await this.eventBus.publish(area.domainEvents);
        area.clearDomainEvents();
        return Result.ok(toAreaDTO(area));
    }
}
//# sourceMappingURL=CreateArea.js.map