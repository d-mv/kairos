import type { SupabaseClient } from "@supabase/supabase-js";
import { BrainFolder } from "../../domain/brain-folder/index.js";
import type { BrainFolderRepository } from "../../domain/brain-folder/index.js";

interface BrainFolderRow {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

function toBrainFolder(row: BrainFolderRow): BrainFolder {
  return BrainFolder.reconstitute(row.id, {
    name: row.name,
    userId: row.user_id,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  });
}

export class SupabaseBrainFolderRepository implements BrainFolderRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: string, userId: string): Promise<BrainFolder | null> {
    const { data, error } = await this.client
      .from("brain_folders")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();
    if (error || !data) return null;
    return toBrainFolder(data as BrainFolderRow);
  }

  async findAll(userId: string): Promise<BrainFolder[]> {
    const { data, error } = await this.client
      .from("brain_folders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (error || !data) return [];
    return (data as BrainFolderRow[]).map(toBrainFolder);
  }

  async save(folder: BrainFolder): Promise<void> {
    const { error } = await this.client.from("brain_folders").upsert({
      id: folder.id,
      name: folder.name,
      user_id: folder.userId,
      created_at: folder.createdAt.toISOString(),
      updated_at: folder.updatedAt.toISOString(),
    });
    if (error) throw new Error(`Failed to save brain folder: ${error.message}`);
  }

  async delete(id: string, userId: string): Promise<void> {
    const { error } = await this.client
      .from("brain_folders")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw new Error(`Failed to delete brain folder: ${error.message}`);
  }
}
