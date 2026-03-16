import { Result, UniqueId } from "../../domain/shared/index.js";
import type {
  CollaborationInviteRepository,
  CollaborationShareRepository,
} from "../../domain/collaboration/index.js";

export class RespondToInvite {
  constructor(
    private readonly inviteRepo: CollaborationInviteRepository,
    private readonly shareRepo: CollaborationShareRepository,
  ) {}

  async accept(inviteId: string, userId: string): Promise<Result<void, string>> {
    const invite = await this.inviteRepo.findById(inviteId);
    if (!invite || invite.recipientUserId !== userId) return Result.fail("Invite not found");
    if (invite.status !== "pending") return Result.fail("Invite is no longer pending");
    if (invite.expiresAt.getTime() <= Date.now()) return Result.fail("Invite has expired");

    invite.status = "accepted";
    invite.respondedAt = new Date();
    await this.inviteRepo.save(invite);
    await this.shareRepo.save({
      id: new UniqueId().value,
      entityType: invite.entityType,
      entityId: invite.entityId,
      ownerUserId: invite.senderUserId,
      collaboratorUserId: invite.recipientUserId,
      createdAt: new Date(),
    });
    return Result.ok(undefined);
  }

  async decline(inviteId: string, userId: string): Promise<Result<void, string>> {
    const invite = await this.inviteRepo.findById(inviteId);
    if (!invite || invite.recipientUserId !== userId) return Result.fail("Invite not found");
    if (invite.status !== "pending") return Result.fail("Invite is no longer pending");

    invite.status = "declined";
    invite.respondedAt = new Date();
    await this.inviteRepo.save(invite);
    return Result.ok(undefined);
  }
}
