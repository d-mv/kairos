import type { BrainFolderDTO } from "@kairos/shared";
import type { BrainFolderRepository } from "../../domain/brain-folder/index.js";
import { Result } from "../../domain/shared/index.js";
export declare class ListBrainFolders {
    private readonly folderRepo;
    constructor(folderRepo: BrainFolderRepository);
    execute(userId: string): Promise<Result<BrainFolderDTO[], string>>;
}
//# sourceMappingURL=ListBrainFolders.d.ts.map