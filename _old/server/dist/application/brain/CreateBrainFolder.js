import { BrainFolder } from "../../domain/brain-folder/index.js";
import { Result } from "../../domain/shared/index.js";
import { toBrainFolderDTO } from "../mappers.js";
export class CreateBrainFolder {
    folderRepo;
    eventBus;
    constructor(folderRepo, eventBus) {
        this.folderRepo = folderRepo;
        this.eventBus = eventBus;
    }
    async execute(input) {
        const result = BrainFolder.create(input.name, input.userId);
        if (result.isErr)
            return Result.fail(result.error);
        const folder = result.value;
        await this.folderRepo.save(folder);
        await this.eventBus.publish(folder.domainEvents);
        folder.clearDomainEvents();
        return Result.ok(toBrainFolderDTO(folder));
    }
}
//# sourceMappingURL=CreateBrainFolder.js.map