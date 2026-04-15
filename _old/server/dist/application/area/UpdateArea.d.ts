import type { AreaDTO } from "@kairos/shared";
import type { AreaRepository } from "../../domain/area/index.js";
import { Result } from "../../domain/shared/index.js";
import type { EventBus } from "../EventBus.js";
export interface UpdateAreaInput {
    id: string;
    userId: string;
    name: string;
}
export declare class UpdateArea {
    private readonly areaRepo;
    private readonly eventBus;
    constructor(areaRepo: AreaRepository, eventBus: EventBus);
    execute(input: UpdateAreaInput): Promise<Result<AreaDTO, string>>;
}
//# sourceMappingURL=UpdateArea.d.ts.map