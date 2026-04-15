import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CollaborationShare,
  CollaborationShareRepository,
} from "../../domain/collaboration/index.js";
import type { ShareEntityType } from "@kairos/shared";

interface CollaborationShareRow {
  id: string;
  entity_type: ShareEntityType;
  entity_id: string;
  owner_user_id: string;
  collaborator_user_id: string;
  created_at: string;
}

function toShare(row: CollaborationShareRow): CollaborationShare {
  return {
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    ownerUserId: row.owner_user_id,
    collaboratorUserId: row.collaborator_user_id,
    createdAt: new Date(row.created_at),
  };
}

export class SupabaseCollaborationShareRepository implements CollaborationShareRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findSharedEntityIds(userId: string, entityType: ShareEntityType): Promise<string[]> {
    const { data, error } = await this.client
      .from("collaboration_shares")
      .select("entity_id")
      .eq("collaborator_user_id", userId)
      .eq("entity_type", entityType);
    if (error || !data) return [];
    return (data as Array<{ entity_id: string }>).map((row) => row.entity_id);
  }

  async findShare(
    userId: string,
    entityType: ShareEntityType,
    entityId: string,
  ): Promise<CollaborationShare | null> {
    const { data, error } = await this.client
      .from("collaboration_shares")
      .select("*")
      .eq("collaborator_user_id", userId)
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .maybeSingle();
    if (error || !data) return null;
    return toShare(data as CollaborationShareRow);
  }

  async save(share: CollaborationShare): Promise<void> {
    const { error } = await this.client.from("collaboration_shares").upsert({
      id: share.id,
      entity_type: share.entityType,
      entity_id: share.entityId,
      owner_user_id: share.ownerUserId,
      collaborator_user_id: share.collaboratorUserId,
      created_at: share.createdAt.toISOString(),
    });
    if (error) throw new Error(`Failed to save collaboration share: ${error.message}`);
  }
}
