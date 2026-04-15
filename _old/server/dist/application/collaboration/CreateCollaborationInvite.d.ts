import type { NotificationDTO, ShareEntityType } from "@kairos/shared";
import { Result } from "../../domain/shared/index.js";
import type { CollaborationInviteRepository, CollaborationShareRepository, UserDirectory } from "../../domain/collaboration/index.js";
import type { ProjectRepository } from "../../domain/project/index.js";
import type { TaskRepository } from "../../domain/task/index.js";
import type { BrainFolderRepository } from "../../domain/brain-folder/index.js";
import type { BrainPageRepository } from "../../domain/brain-page/index.js";
export interface CreateCollaborationInviteInput {
    senderUserId: string;
    recipientEmail: string;
    entityType: ShareEntityType;
    entityId: string;
}
export declare class CreateCollaborationInvite {
    private readonly userDirectory;
    private readonly inviteRepo;
    private readonly shareRepo;
    private readonly projectRepo;
    private readonly taskRepo;
    private readonly folderRepo;
    private readonly pageRepo;
    private readonly onInviteCreated?;
    constructor(userDirectory: UserDirectory, inviteRepo: CollaborationInviteRepository, shareRepo: CollaborationShareRepository, projectRepo: ProjectRepository, taskRepo: TaskRepository, folderRepo: BrainFolderRepository, pageRepo: BrainPageRepository, onInviteCreated?: ((recipientUserId: string, notification: NotificationDTO) => void | Promise<void>) | undefined);
    execute(input: CreateCollaborationInviteInput): Promise<Result<void, string>>;
    private findEntity;
}
//# sourceMappingURL=CreateCollaborationInvite.d.ts.map