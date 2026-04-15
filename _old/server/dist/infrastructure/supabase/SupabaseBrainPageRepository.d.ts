import type { SupabaseClient } from "@supabase/supabase-js";
import { BrainPage } from "../../domain/brain-page/index.js";
import type { BrainPageRepository } from "../../domain/brain-page/index.js";
import type { CollaborationShareRepository } from "../../domain/collaboration/index.js";
export declare class SupabaseBrainPageRepository implements BrainPageRepository {
    private readonly client;
    private readonly shareRepo;
    constructor(client: SupabaseClient, shareRepo: CollaborationShareRepository);
    private queryPagesByIds;
    private queryPagesByFolderIds;
    private dedupe;
    findById(id: string, userId: string): Promise<BrainPage | null>;
    findAll(userId: string): Promise<BrainPage[]>;
    findByFolderId(folderId: string, userId: string): Promise<BrainPage[]>;
    save(page: BrainPage): Promise<void>;
    delete(id: string, userId: string): Promise<void>;
}
//# sourceMappingURL=SupabaseBrainPageRepository.d.ts.map