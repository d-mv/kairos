import type { NotificationDTO, ShareEntityType } from "@kairos/shared";
import { Result, UniqueId } from "../../domain/shared/index.js";
import type {
  CollaborationInviteRepository,
  CollaborationShareRepository,
  UserDirectory,
} from "../../domain/collaboration/index.js";
import type { ProjectRepository } from "../../domain/project/index.js";
import type { TaskRepository } from "../../domain/task/index.js";
import type { BrainFolderRepository } from "../../domain/brain-folder/index.js";
import type { BrainPageRepository } from "../../domain/brain-page/index.js";
import type { CollaborationInvite } from "../../domain/collaboration/index.js";

export interface CreateCollaborationInviteInput {
  senderUserId: string;
  recipientEmail: string;
  entityType: ShareEntityType;
  entityId: string;
}

type ShareableEntity = { id: string; userId: string; name?: string; title?: string };

export class CreateCollaborationInvite {
  constructor(
    private readonly userDirectory: UserDirectory,
    private readonly inviteRepo: CollaborationInviteRepository,
    private readonly shareRepo: CollaborationShareRepository,
    private readonly projectRepo: ProjectRepository,
    private readonly taskRepo: TaskRepository,
    private readonly folderRepo: BrainFolderRepository,
    private readonly pageRepo: BrainPageRepository,
    private readonly onInviteCreated?: (
      recipientUserId: string,
      notification: NotificationDTO,
    ) => void | Promise<void>,
  ) {}

  async execute(input: CreateCollaborationInviteInput): Promise<Result<void, string>> {
    const recipient = await this.userDirectory.findByEmail(input.recipientEmail);
    if (!recipient) return Result.fail("User with this email is not registered");
    if (recipient.id === input.senderUserId) return Result.fail("You cannot share with yourself");

    const sender = await this.userDirectory.findById(input.senderUserId);
    if (!sender) return Result.fail("Sender not found");

    const entity = await this.findEntity(input.entityType, input.entityId, input.senderUserId);
    if (!entity) return Result.fail("Entity not found");
    if (entity.userId !== input.senderUserId) return Result.fail("Only the owner can share this");

    const existingShare = await this.shareRepo.findShare(
      recipient.id,
      input.entityType,
      input.entityId,
    );
    if (existingShare) return Result.fail("Already shared with this user");

    const existingInvite = await this.inviteRepo.findPendingByRecipientAndEntity(
      recipient.id,
      input.entityType,
      input.entityId,
    );
    if (existingInvite) return Result.fail("Invite already pending for this user");

    const label = entity.name ?? entity.title ?? "Shared item";

    const invite: CollaborationInvite = {
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

  private async findEntity(
    entityType: ShareEntityType,
    entityId: string,
    userId: string,
  ): Promise<ShareableEntity | null> {
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
