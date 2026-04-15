import { Result } from "../../domain/shared/index.js";
import { toBrainPageDTO } from "../mappers.js";
export class UpdateBrainPage {
    pageRepo;
    folderRepo;
    eventBus;
    constructor(pageRepo, folderRepo, eventBus) {
        this.pageRepo = pageRepo;
        this.folderRepo = folderRepo;
        this.eventBus = eventBus;
    }
    async execute(input) {
        const page = await this.pageRepo.findById(input.id, input.userId);
        if (!page)
            return Result.fail("Page not found");
        if (input.folderId) {
            const folder = await this.folderRepo.findById(input.folderId, input.userId);
            if (!folder)
                return Result.fail("Folder not found");
        }
        const result = page.update({
            title: input.title,
            folderId: input.folderId,
            contentJson: input.contentJson,
        });
        if (result.isErr)
            return Result.fail(result.error);
        await this.pageRepo.save(page);
        await this.eventBus.publish(page.domainEvents);
        page.clearDomainEvents();
        return Result.ok(toBrainPageDTO(page));
    }
}
//# sourceMappingURL=UpdateBrainPage.js.map