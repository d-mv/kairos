import type { BrainContent } from "@kairos/shared";
import { Entity, Result } from "../shared/index.js";
interface BrainPageProps {
    title: string;
    folderId: string | null;
    contentJson: BrainContent;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class BrainPage extends Entity<BrainPageProps> {
    private constructor();
    static create(title: string, userId: string, options?: {
        folderId?: string | null;
        contentJson?: BrainContent;
    }, id?: string): Result<BrainPage, string>;
    static reconstitute(id: string, props: BrainPageProps): BrainPage;
    get title(): string;
    get folderId(): string | null;
    get contentJson(): BrainContent;
    get userId(): string;
    get createdAt(): Date;
    get updatedAt(): Date;
    update(data: {
        title?: string;
        folderId?: string | null;
        contentJson?: BrainContent;
    }): Result<void, string>;
}
export {};
//# sourceMappingURL=BrainPage.d.ts.map