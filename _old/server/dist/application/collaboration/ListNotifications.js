import { Result } from "../../domain/shared/index.js";
export class ListNotifications {
    inviteRepo;
    constructor(inviteRepo) {
        this.inviteRepo = inviteRepo;
    }
    async execute(userId) {
        const now = Date.now();
        const invites = await this.inviteRepo.findPendingByRecipientUserId(userId);
        return Result.ok(invites
            .filter((invite) => invite.expiresAt.getTime() > now)
            .map((invite) => ({
            id: invite.id,
            type: "share_invite",
            entityType: invite.entityType,
            entityId: invite.entityId,
            entityLabel: invite.entityLabel,
            senderEmail: invite.senderEmail,
            recipientEmail: invite.recipientEmail,
            createdAt: invite.createdAt.toISOString(),
            expiresAt: invite.expiresAt.toISOString(),
        })));
    }
}
//# sourceMappingURL=ListNotifications.js.map