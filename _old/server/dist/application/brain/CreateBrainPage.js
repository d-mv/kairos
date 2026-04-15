import { BrainPage } from "../../domain/brain-page/index.js";
import { Result } from "../../domain/shared/index.js";
import { toBrainPageDTO } from "../mappers.js";
export class CreateBrainPage {
    pageRepo;
    folderRepo;
    eventBus;
    constructor(pageRepo, folderRepo, eventBus) {
        this.pageRepo = pageRepo;
        this.folderRepo = folderRepo;
        this.eventBus = eventBus;
    }
    async execute(input) {
        let pageUserId = input.userId;
        if (input.folderId) {
            const folder = await this.folderRepo.findById(input.folderId, input.userId);
            if (!folder)
                return Result.fail("Folder not found");
            pageUserId = folder.userId;
        }
        const result = BrainPage.create(input.title, pageUserId, {
            folderId: input.folderId ?? null,
            contentJson: input.contentJson,
        });
        if (result.isErr)
            return Result.fail(result.error);
        const page = result.value;
        await this.pageRepo.save(page);
        await this.eventBus.publish(page.domainEvents);
        page.clearDomainEvents();
        return Result.ok(toBrainPageDTO(page));
    }
}
//# sourceMappingURL=CreateBrainPage.js.map