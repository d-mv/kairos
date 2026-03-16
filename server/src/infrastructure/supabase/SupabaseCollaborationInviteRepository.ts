import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CollaborationInvite,
  CollaborationInviteRepository,
} from "../../domain/collaboration/index.js";
import type { ShareEntityType } from "@kairos/shared";

interface CollaborationInviteRow {
  id: string;
  entity_type: ShareEntityType;
  entity_id: string;
  entity_label: string;
  sender_user_id: string;
  sender_email: string;
  recipient_user_id: string;
  recipient_email: string;
  status: "pending" | "accepted" | "declined";
  expires_at: string;
  created_at: string;
  responded_at: string | null;
}

function toInvite(row: CollaborationInviteRow): CollaborationInvite {
  return {
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    entityLabel: row.entity_label,
    senderUserId: row.sender_user_id,
    senderEmail: row.sender_email,
    recipientUserId: row.recipient_user_id,
    recipientEmail: row.recipient_email,
    status: row.status,
    expiresAt: new Date(row.expires_at),
    createdAt: new Date(row.created_at),
    respondedAt: row.responded_at ? new Date(row.responded_at) : null,
  };
}

export class SupabaseCollaborationInviteRepository implements CollaborationInviteRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findPendingByRecipientUserId(userId: string): Promise<CollaborationInvite[]> {
    const { data, error } = await this.client
      .from("collaboration_invites")
      .select("*")
      .eq("recipient_user_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return (data as CollaborationInviteRow[]).map(toInvite);
  }

  async findPendingByRecipientAndEntity(
    userId: string,
    entityType: ShareEntityType,
    entityId: string,
  ): Promise<CollaborationInvite | null> {
    const { data, error } = await this.client
      .from("collaboration_invites")
      .select("*")
      .eq("recipient_user_id", userId)
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .eq("status", "pending")
      .maybeSingle();
    if (error || !data) return null;
    return toInvite(data as CollaborationInviteRow);
  }

  async findById(id: string): Promise<CollaborationInvite | null> {
    const { data, error } = await this.client
      .from("collaboration_invites")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) return null;
    return toInvite(data as CollaborationInviteRow);
  }

  async save(invite: CollaborationInvite): Promise<void> {
    const { error } = await this.client.from("collaboration_invites").upsert({
      id: invite.id,
      entity_type: invite.entityType,
      entity_id: invite.entityId,
      entity_label: invite.entityLabel,
      sender_user_id: invite.senderUserId,
      sender_email: invite.senderEmail,
      recipient_user_id: invite.recipientUserId,
      recipient_email: invite.recipientEmail,
      status: invite.status,
      expires_at: invite.expiresAt.toISOString(),
      created_at: invite.createdAt.toISOString(),
      responded_at: invite.respondedAt?.toISOString() ?? null,
    });
    if (error) throw new Error(`Failed to save collaboration invite: ${error.message}`);
  }
}
