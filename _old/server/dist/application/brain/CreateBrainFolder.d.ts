import type { BrainFolderDTO } from "@kairos/shared";
import type { BrainFolderRepository } from "../../domain/brain-folder/index.js";
import { Result } from "../../domain/shared/index.js";
import type { EventBus } from "../EventBus.js";
export interface CreateBrainFolderInput {
    name: string;
    userId: string;
}
export declare class CreateBrainFolder {
    private readonly folderRepo;
    private readonly eventBus;
    constructor(folderRepo: BrainFolderRepository, eventBus: EventBus);
    execute(input: CreateBrainFolderInput): Promise<Result<BrainFolderDTO, string>>;
}
//# sourceMappingURL=CreateBrainFolder.d.ts.map