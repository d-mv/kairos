import type { BrainPageDTO } from "@kairos/shared";
import type { BrainPageRepository } from "../../domain/brain-page/index.js";
import { Result } from "../../domain/shared/index.js";
export declare class ListBrainPages {
    private readonly pageRepo;
    constructor(pageRepo: BrainPageRepository);
    execute(userId: string): Promise<Result<BrainPageDTO[], string>>;
}
//# sourceMappingURL=ListBrainPages.d.ts.map