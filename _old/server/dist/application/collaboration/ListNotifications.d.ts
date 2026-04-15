import type { NotificationDTO } from "@kairos/shared";
import { Result } from "../../domain/shared/index.js";
import type { CollaborationInviteRepository } from "../../domain/collaboration/index.js";
export declare class ListNotifications {
    private readonly inviteRepo;
    constructor(inviteRepo: CollaborationInviteRepository);
    execute(userId: string): Promise<Result<NotificationDTO[], string>>;
}
//# sourceMappingURL=ListNotifications.d.ts.map