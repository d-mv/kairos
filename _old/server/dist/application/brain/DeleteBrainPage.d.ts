import type { BrainPageRepository } from "../../domain/brain-page/index.js";
import { Result } from "../../domain/shared/index.js";
export interface DeleteBrainPageInput {
    id: string;
    userId: string;
}
export declare class DeleteBrainPage {
    private readonly pageRepo;
    constructor(pageRepo: BrainPageRepository);
    execute(input: DeleteBrainPageInput): Promise<Result<void, string>>;
}
//# sourceMappingURL=DeleteBrainPage.d.ts.map