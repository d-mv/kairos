import type { NotificationDTO } from "@kairos/shared";
import { Result } from "../../domain/shared/index.js";
import type { CollaborationInviteRepository } from "../../domain/collaboration/index.js";

export class ListNotifications {
  constructor(private readonly inviteRepo: CollaborationInviteRepository) {}

  async execute(userId: string): Promise<Result<NotificationDTO[], string>> {
    const now = Date.now();
    const invites = await this.inviteRepo.findPendingByRecipientUserId(userId);
    return Result.ok(
      invites
        .filter((invite) => invite.expiresAt.getTime() > now)
        .map((invite) => ({
          id: invite.id,
          type: "share_invite" as const,
          entityType: invite.entityType,
          entityId: invite.entityId,
          entityLabel: invite.entityLabel,
          senderEmail: invite.senderEmail,
          recipientEmail: invite.recipientEmail,
          createdAt: invite.createdAt.toISOString(),
          expiresAt: invite.expiresAt.toISOString(),
        })),
    );
  }
}
