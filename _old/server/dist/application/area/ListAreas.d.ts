import type { AreaDTO } from "@kairos/shared";
import type { AreaRepository } from "../../domain/area/index.js";
import { Result } from "../../domain/shared/index.js";
export declare class ListAreas {
    private readonly areaRepo;
    constructor(areaRepo: AreaRepository);
    execute(userId: string): Promise<Result<AreaDTO[], string>>;
}
//# sourceMappingURL=ListAreas.d.ts.map