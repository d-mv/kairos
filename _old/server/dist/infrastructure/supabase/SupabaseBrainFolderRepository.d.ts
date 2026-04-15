import type { SupabaseClient } from "@supabase/supabase-js";
import { BrainFolder } from "../../domain/brain-folder/index.js";
import type { BrainFolderRepository } from "../../domain/brain-folder/index.js";
import type { CollaborationShareRepository } from "../../domain/collaboration/index.js";
export declare class SupabaseBrainFolderRepository implements BrainFolderRepository {
    private readonly client;
    private readonly shareRepo;
    constructor(client: SupabaseClient, shareRepo: CollaborationShareRepository);
    findById(id: string, userId: string): Promise<BrainFolder | null>;
    findAll(userId: string): Promise<BrainFolder[]>;
    save(folder: BrainFolder): Promise<void>;
    delete(id: string, userId: string): Promise<void>;
}
//# sourceMappingURL=SupabaseBrainFolderRepository.d.ts.map