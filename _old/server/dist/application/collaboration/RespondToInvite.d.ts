import { Result } from "../../domain/shared/index.js";
import type { CollaborationInviteRepository, CollaborationShareRepository } from "../../domain/collaboration/index.js";
export declare class RespondToInvite {
    private readonly inviteRepo;
    private readonly shareRepo;
    constructor(inviteRepo: CollaborationInviteRepository, shareRepo: CollaborationShareRepository);
    accept(inviteId: string, userId: string): Promise<Result<void, string>>;
    decline(inviteId: string, userId: string): Promise<Result<void, string>>;
}
//# sourceMappingURL=RespondToInvite.d.ts.map