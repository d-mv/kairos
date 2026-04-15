import type { BrainPage } from "./BrainPage.js";
export interface BrainPageRepository {
    findById(id: string, userId: string): Promise<BrainPage | null>;
    findAll(userId: string): Promise<BrainPage[]>;
    findByFolderId(folderId: string, userId: string): Promise<BrainPage[]>;
    save(page: BrainPage): Promise<void>;
    delete(id: string, userId: string): Promise<void>;
}
//# sourceMappingURL=BrainPageRepository.d.ts.map