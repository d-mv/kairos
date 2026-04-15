import type { SupabaseClient } from "@supabase/supabase-js";
import type { CollaborationShare, CollaborationShareRepository } from "../../domain/collaboration/index.js";
import type { ShareEntityType } from "@kairos/shared";
export declare class SupabaseCollaborationShareRepository implements CollaborationShareRepository {
    private readonly client;
    constructor(client: SupabaseClient);
    findSharedEntityIds(userId: string, entityType: ShareEntityType): Promise<string[]>;
    findShare(userId: string, entityType: ShareEntityType, entityId: string): Promise<CollaborationShare | null>;
    save(share: CollaborationShare): Promise<void>;
}
//# sourceMappingURL=SupabaseCollaborationShareRepository.d.ts.map