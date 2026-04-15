import type { AreaDTO } from "@kairos/shared";
import type { AreaRepository } from "../../domain/area/index.js";
import { Result } from "../../domain/shared/index.js";
import type { EventBus } from "../EventBus.js";
export interface CreateAreaInput {
    name: string;
    userId: string;
}
export declare class CreateArea {
    private readonly areaRepo;
    private readonly eventBus;
    constructor(areaRepo: AreaRepository, eventBus: EventBus);
    execute(input: CreateAreaInput): Promise<Result<AreaDTO, string>>;
}
//# sourceMappingURL=CreateArea.d.ts.map