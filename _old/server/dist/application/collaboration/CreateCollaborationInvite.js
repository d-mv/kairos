import { Result, UniqueId } from "../../domain/shared/index.js";
export class CreateCollaborationInvite {
    userDirectory;
    inviteRepo;
    shareRepo;
    projectRepo;
    taskRepo;
    folderRepo;
    pageRepo;
    onInviteCreated;
    constructor(userDirectory, inviteRepo, shareRepo, projectRepo, taskRepo, folderRepo, pageRepo, onInviteCreated) {
        this.userDirectory = userDirectory;
        this.inviteRepo = inviteRepo;
        this.shareRepo = shareRepo;
        this.projectRepo = projectRepo;
        this.taskRepo = taskRepo;
        this.folderRepo = folderRepo;
        this.pageRepo = pageRepo;
        this.onInviteCreated = onInviteCreated;
    }
    async execute(input) {
        const recipient = await this.userDirectory.findByEmail(input.recipientEmail);
        if (!recipient)
            return Result.fail("User with this email is not registered");
        if (recipient.id === input.senderUserId)
            return Result.fail("You cannot share with yourself");
        const sender = await this.userDirectory.findById(input.senderUserId);
        if (!sender)
            return Result.fail("Sender not found");
        const entity = await this.findEntity(input.entityType, input.entityId, input.senderUserId);
        if (!entity)
            return Result.fail("Entity not found");
        if (entity.userId !== input.senderUserId)
            return Result.fail("Only the owner can share this");
        const existingShare = await this.shareRepo.findShare(recipient.id, input.entityType, input.entityId);
        if (existingShare)
            return Result.fail("Already shared with this user");
        const existingInvite = await this.inviteRepo.findPendingByRecipientAndEntity(recipient.id, input.entityType, input.entityId);
        if (existingInvite)
            return Result.fail("Invite already pending for this user");
        const label = entity.name ?? entity.title ?? "Shared item";
        const invite = {
            id: new UniqueId().value,
            entityType: input.entityType,
            entityId: input.entityId,
            entityLabel: label,
            senderUserId: input.senderUserId,
            senderEmail: sender.email,
            recipientUserId: recipient.id,
            recipientEmail: recipient.email,
            status: "pending",
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
            respondedAt: null,
        };
        await this.inviteRepo.save(invite);
        await this.onInviteCreated?.(recipient.id, {
            id: invite.id,
            type: "share_invite",
            entityType: invite.entityType,
            entityId: invite.entityId,
            entityLabel: invite.entityLabel,
            senderEmail: invite.senderEmail,
            recipientEmail: invite.recipientEmail,
            createdAt: invite.createdAt.toISOString(),
            expiresAt: invite.expiresAt.toISOString(),
        });
        return Result.ok(undefined);
    }
    async findEntity(entityType, entityId, userId) {
        switch (entityType) {
            case "project":
                return this.projectRepo.findById(entityId, userId);
            case "task":
                return this.taskRepo.findById(entityId, userId);
            case "brain_folder":
                return this.folderRepo.findById(entityId, userId);
            case "brain_page":
                return this.pageRepo.findById(entityId, userId);
        }
    }
}
//# sourceMappingURL=CreateCollaborationInvite.js.map