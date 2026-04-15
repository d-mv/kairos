import { Result } from "../../domain/shared/index.js";
import { toBrainPageDTO } from "../mappers.js";
export class ListBrainPages {
    pageRepo;
    constructor(pageRepo) {
        this.pageRepo = pageRepo;
    }
    async execute(userId) {
        const pages = await this.pageRepo.findAll(userId);
        return Result.ok(pages.map(toBrainPageDTO));
    }
}
//# sourceMappingURL=ListBrainPages.js.map