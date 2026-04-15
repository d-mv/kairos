import type { BrainFolder } from "./BrainFolder.js";
export interface BrainFolderRepository {
    findById(id: string, userId: string): Promise<BrainFolder | null>;
    findAll(userId: string): Promise<BrainFolder[]>;
    save(folder: BrainFolder): Promise<void>;
    delete(id: string, userId: string): Promise<void>;
}
//# sourceMappingURL=BrainFolderRepository.d.ts.map