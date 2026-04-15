import { Result } from "../../domain/shared/index.js";
import { toAreaDTO } from "../mappers.js";
export class ListAreas {
    areaRepo;
    constructor(areaRepo) {
        this.areaRepo = areaRepo;
    }
    async execute(userId) {
        const areas = await this.areaRepo.findAll(userId);
        return Result.ok(areas.map(toAreaDTO));
    }
}
//# sourceMappingURL=ListAreas.js.map