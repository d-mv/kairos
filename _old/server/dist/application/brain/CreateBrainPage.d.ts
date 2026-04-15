import type { BrainContent, BrainPageDTO } from "@kairos/shared";
import type { BrainFolderRepository } from "../../domain/brain-folder/index.js";
import type { BrainPageRepository } from "../../domain/brain-page/index.js";
import { Result } from "../../domain/shared/index.js";
import type { EventBus } from "../EventBus.js";
export interface CreateBrainPageInput {
    title: string;
    userId: string;
    folderId?: string | null;
    contentJson?: BrainContent;
}
export declare class CreateBrainPage {
    private readonly pageRepo;
    private readonly folderRepo;
    private readonly eventBus;
    constructor(pageRepo: BrainPageRepository, folderRepo: BrainFolderRepository, eventBus: EventBus);
    execute(input: CreateBrainPageInput): Promise<Result<BrainPageDTO, string>>;
}
//# sourceMappingURL=CreateBrainPage.d.ts.map