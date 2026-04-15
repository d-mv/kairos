import type { BrainContent, BrainPageDTO } from "@kairos/shared";
import type { BrainFolderRepository } from "../../domain/brain-folder/index.js";
import type { BrainPageRepository } from "../../domain/brain-page/index.js";
import { Result } from "../../domain/shared/index.js";
import type { EventBus } from "../EventBus.js";
export interface UpdateBrainPageInput {
    id: string;
    userId: string;
    title?: string;
    folderId?: string | null;
    contentJson?: BrainContent;
}
export declare class UpdateBrainPage {
    private readonly pageRepo;
    private readonly folderRepo;
    private readonly eventBus;
    constructor(pageRepo: BrainPageRepository, folderRepo: BrainFolderRepository, eventBus: EventBus);
    execute(input: UpdateBrainPageInput): Promise<Result<BrainPageDTO, string>>;
}
//# sourceMappingURL=UpdateBrainPage.d.ts.map