import type { SupabaseClient } from "@supabase/supabase-js";
import type { LinkType, EntityType } from "@kairos/shared";
import { Link } from "../../domain/link/index.js";
import type { LinkRepository } from "../../domain/link/index.js";

interface LinkRow {
  id: string;
  source_id: string;
  source_type: EntityType;
  target_id: string;
  target_type: EntityType;
  link_type: LinkType;
  user_id: string;
  created_at: string;
}

function toLink(row: LinkRow): Link {
  return Link.reconstitute(row.id, {
    sourceId: row.source_id,
    sourceType: row.source_type,
    targetId: row.target_id,
    targetType: row.target_type,
    linkType: row.link_type,
    userId: row.user_id,
    createdAt: new Date(row.created_at),
  });
}

export class SupabaseLinkRepository implements LinkRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: string, userId: string): Promise<Link | null> {
    const { data, error } = await this.client
      .from("links")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();
    if (error || !data) return null;
    return toLink(data as LinkRow);
  }

  async findBySourceId(sourceId: string, userId: string): Promise<Link[]> {
    const { data, error } = await this.client
      .from("links")
      .select("*")
      .eq("source_id", sourceId)
      .eq("user_id", userId);
    if (error || !data) return [];
    return (data as LinkRow[]).map(toLink);
  }

  async findByTargetId(targetId: string, userId: string): Promise<Link[]> {
    const { data, error } = await this.client
      .from("links")
      .select("*")
      .eq("target_id", targetId)
      .eq("user_id", userId);
    if (error || !data) return [];
    return (data as LinkRow[]).map(toLink);
  }

  async findByEntityId(entityId: string, userId: string): Promise<Link[]> {
    const { data, error } = await this.client
      .from("links")
      .select("*")
      .eq("user_id", userId)
      .or(`source_id.eq.${entityId},target_id.eq.${entityId}`);
    if (error || !data) return [];
    return (data as LinkRow[]).map(toLink);
  }

  async save(link: Link): Promise<void> {
    const { error } = await this.client.from("links").upsert({
      id: link.id,
      source_id: link.sourceId,
      source_type: link.sourceType,
      target_id: link.targetId,
      target_type: link.targetType,
      link_type: link.linkType,
      user_id: link.userId,
      created_at: link.createdAt.toISOString(),
    });
    if (error) throw new Error(`Failed to save link: ${error.message}`);
  }

  async delete(id: string, userId: string): Promise<void> {
    const { error } = await this.client.from("links").delete().eq("id", id).eq("user_id", userId);
    if (error) throw new Error(`Failed to delete link: ${error.message}`);
  }
}
