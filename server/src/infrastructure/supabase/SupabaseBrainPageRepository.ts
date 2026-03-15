import type { BrainContent } from "@kairos/shared";
import type { SupabaseClient } from "@supabase/supabase-js";
import { BrainPage } from "../../domain/brain-page/index.js";
import type { BrainPageRepository } from "../../domain/brain-page/index.js";

interface BrainPageRow {
  id: string;
  title: string;
  folder_id: string | null;
  content_json: BrainContent;
  user_id: string;
  created_at: string;
  updated_at: string;
}

function toBrainPage(row: BrainPageRow): BrainPage {
  return BrainPage.reconstitute(row.id, {
    title: row.title,
    folderId: row.folder_id,
    contentJson: row.content_json,
    userId: row.user_id,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  });
}

export class SupabaseBrainPageRepository implements BrainPageRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: string, userId: string): Promise<BrainPage | null> {
    const { data, error } = await this.client
      .from("brain_pages")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();
    if (error || !data) return null;
    return toBrainPage(data as BrainPageRow);
  }

  async findAll(userId: string): Promise<BrainPage[]> {
    const { data, error } = await this.client
      .from("brain_pages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (error || !data) return [];
    return (data as BrainPageRow[]).map(toBrainPage);
  }

  async findByFolderId(folderId: string, userId: string): Promise<BrainPage[]> {
    const { data, error } = await this.client
      .from("brain_pages")
      .select("*")
      .eq("folder_id", folderId)
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (error || !data) return [];
    return (data as BrainPageRow[]).map(toBrainPage);
  }

  async save(page: BrainPage): Promise<void> {
    const { error } = await this.client.from("brain_pages").upsert({
      id: page.id,
      title: page.title,
      folder_id: page.folderId,
      content_json: page.contentJson,
      user_id: page.userId,
      created_at: page.createdAt.toISOString(),
      updated_at: page.updatedAt.toISOString(),
    });
    if (error) throw new Error(`Failed to save brain page: ${error.message}`);
  }

  async delete(id: string, userId: string): Promise<void> {
    const { error } = await this.client
      .from("brain_pages")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw new Error(`Failed to delete brain page: ${error.message}`);
  }
}
