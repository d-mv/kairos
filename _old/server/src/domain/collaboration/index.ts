import type { ShareEntityType } from "@kairos/shared";

export interface CollaborationShare {
  id: string;
  entityType: ShareEntityType;
  entityId: string;
  ownerUserId: string;
  collaboratorUserId: string;
  createdAt: Date;
}

export interface CollaborationInvite {
  id: string;
  entityType: ShareEntityType;
  entityId: string;
  entityLabel: string;
  senderUserId: string;
  senderEmail: string;
  recipientUserId: string;
  recipientEmail: string;
  status: "pending" | "accepted" | "declined";
  createdAt: Date;
  expiresAt: Date;
  respondedAt: Date | null;
}

export interface CollaborationShareRepository {
  findSharedEntityIds(userId: string, entityType: ShareEntityType): Promise<string[]>;
  findShare(
    userId: string,
    entityType: ShareEntityType,
    entityId: string,
  ): Promise<CollaborationShare | null>;
  save(share: CollaborationShare): Promise<void>;
}

export interface CollaborationInviteRepository {
  findPendingByRecipientUserId(userId: string): Promise<CollaborationInvite[]>;
  findPendingByRecipientAndEntity(
    userId: string,
    entityType: ShareEntityType,
    entityId: string,
  ): Promise<CollaborationInvite | null>;
  findById(id: string): Promise<CollaborationInvite | null>;
  save(invite: CollaborationInvite): Promise<void>;
}

export interface UserDirectoryEntry {
  id: string;
  email: string;
}

export interface UserDirectory {
  findByEmail(email: string): Promise<UserDirectoryEntry | null>;
  findById(id: string): Promise<UserDirectoryEntry | null>;
}
