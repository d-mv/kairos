import { Result, UniqueId } from "../../domain/shared/index.js";
export class RespondToInvite {
    inviteRepo;
    shareRepo;
    constructor(inviteRepo, shareRepo) {
        this.inviteRepo = inviteRepo;
        this.shareRepo = shareRepo;
    }
    async accept(inviteId, userId) {
        const invite = await this.inviteRepo.findById(inviteId);
        if (!invite || invite.recipientUserId !== userId)
            return Result.fail("Invite not found");
        if (invite.status !== "pending")
            return Result.fail("Invite is no longer pending");
        if (invite.expiresAt.getTime() <= Date.now())
            return Result.fail("Invite has expired");
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
    async decline(inviteId, userId) {
        const invite = await this.inviteRepo.findById(inviteId);
        if (!invite || invite.recipientUserId !== userId)
            return Result.fail("Invite not found");
        if (invite.status !== "pending")
            return Result.fail("Invite is no longer pending");
        invite.status = "declined";
        invite.respondedAt = new Date();
        await this.inviteRepo.save(invite);
        return Result.ok(undefined);
    }
}
//# sourceMappingURL=RespondToInvite.js.map