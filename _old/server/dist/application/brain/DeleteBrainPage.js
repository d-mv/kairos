import { Result } from "../../domain/shared/index.js";
export class DeleteBrainPage {
    pageRepo;
    constructor(pageRepo) {
        this.pageRepo = pageRepo;
    }
    async execute(input) {
        const page = await this.pageRepo.findById(input.id, input.userId);
        if (!page)
            return Result.fail("Page not found");
        await this.pageRepo.delete(input.id, input.userId);
        return Result.ok(undefined);
    }
}
//# sourceMappingURL=DeleteBrainPage.js.map