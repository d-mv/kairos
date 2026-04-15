import { Result } from "../../domain/shared/index.js";
import { toBrainFolderDTO } from "../mappers.js";
export class ListBrainFolders {
    folderRepo;
    constructor(folderRepo) {
        this.folderRepo = folderRepo;
    }
    async execute(userId) {
        const folders = await this.folderRepo.findAll(userId);
        return Result.ok(folders.map(toBrainFolderDTO));
    }
}
//# sourceMappingURL=ListBrainFolders.js.map