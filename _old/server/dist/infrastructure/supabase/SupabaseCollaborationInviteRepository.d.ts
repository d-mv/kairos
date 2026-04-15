import type { SupabaseClient } from "@supabase/supabase-js";
import type { CollaborationInvite, CollaborationInviteRepository } from "../../domain/collaboration/index.js";
import type { ShareEntityType } from "@kairos/shared";
export declare class SupabaseCollaborationInviteRepository implements CollaborationInviteRepository {
    private readonly client;
    constructor(client: SupabaseClient);
    findPendingByRecipientUserId(userId: string): Promise<CollaborationInvite[]>;
    findPendingByRecipientAndEntity(userId: string, entityType: ShareEntityType, entityId: string): Promise<CollaborationInvite | null>;
    findById(id: string): Promise<CollaborationInvite | null>;
    save(invite: CollaborationInvite): Promise<void>;
}
//# sourceMappingURL=SupabaseCollaborationInviteRepository.d.ts.map