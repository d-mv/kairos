import type { BrainContent } from "@kairos/shared";
import type { SupabaseClient } from "@supabase/supabase-js";
import { BrainPage } from "../../domain/brain-page/index.js";
import type { BrainPageRepository } from "../../domain/brain-page/index.js";
import type { CollaborationShareRepository } from "../../domain/collaboration/index.js";

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
  constructor(
    private readonly client: SupabaseClient,
    private readonly shareRepo: CollaborationShareRepository,
  ) {}

  private async queryPagesByIds(ids: string[]): Promise<BrainPage[]> {
    if (ids.length === 0) return [];
    const { data, error } = await this.client.from("brain_pages").select("*").in("id", ids);
    if (error || !data) return [];
    return (data as BrainPageRow[]).map(toBrainPage);
  }

  private async queryPagesByFolderIds(folderIds: string[]): Promise<BrainPage[]> {
    if (folderIds.length === 0) return [];
    const { data, error } = await this.client
      .from("brain_pages")
      .select("*")
      .in("folder_id", folderIds);
    if (error || !data) return [];
    return (data as BrainPageRow[]).map(toBrainPage);
  }

  private dedupe(pages: BrainPage[]): BrainPage[] {
    const seen = new Set<string>();
    return pages.filter((page) => {
      if (seen.has(page.id)) return false;
      seen.add(page.id);
      return true;
    });
  }

  async findById(id: string, userId: string): Promise<BrainPage | null> {
    const { data } = await this.client
      .from("brain_pages")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();
    if (data) return toBrainPage(data as BrainPageRow);
    const { data: sharedData, error } = await this.client
      .from("brain_pages")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !sharedData) return null;
    const row = sharedData as BrainPageRow;
    const [sharedPageIds, sharedFolderIds] = await Promise.all([
      this.shareRepo.findSharedEntityIds(userId, "brain_page"),
      this.shareRepo.findSharedEntityIds(userId, "brain_folder"),
    ]);
    if (sharedPageIds.includes(id) || (row.folder_id && sharedFolderIds.includes(row.folder_id))) {
      return toBrainPage(row);
    }
    return null;
  }

  async findAll(userId: string): Promise<BrainPage[]> {
    const { data, error } = await this.client
      .from("brain_pages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    const ownPages = error || !data ? [] : (data as BrainPageRow[]).map(toBrainPage);
    const [sharedPageIds, sharedFolderIds] = await Promise.all([
      this.shareRepo.findSharedEntityIds(userId, "brain_page"),
      this.shareRepo.findSharedEntityIds(userId, "brain_folder"),
    ]);
    const [sharedPages, folderPages] = await Promise.all([
      this.queryPagesByIds(sharedPageIds),
      this.queryPagesByFolderIds(sharedFolderIds),
    ]);
    return this.dedupe([...ownPages, ...sharedPages, ...folderPages]);
  }

  async findByFolderId(folderId: string, userId: string): Promise<BrainPage[]> {
    const { data } = await this.client
      .from("brain_pages")
      .select("*")
      .eq("folder_id", folderId)
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    const ownPages = data ? (data as BrainPageRow[]).map(toBrainPage) : [];
    const sharedFolderIds = await this.shareRepo.findSharedEntityIds(userId, "brain_folder");
    if (!sharedFolderIds.includes(folderId)) return ownPages;
    const { data: sharedData, error } = await this.client
      .from("brain_pages")
      .select("*")
      .eq("folder_id", folderId)
      .order("created_at", { ascending: true });
    if (error || !sharedData) return ownPages;
    return this.dedupe([...ownPages, ...(sharedData as BrainPageRow[]).map(toBrainPage)]);
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
    const page = await this.findById(id, userId);
    if (!page) return;
    const { error } = await this.client
      .from("brain_pages")
      .delete()
      .eq("id", id)
      .eq("user_id", page.userId);
    if (error) throw new Error(`Failed to delete brain page: ${error.message}`);
  }
}
