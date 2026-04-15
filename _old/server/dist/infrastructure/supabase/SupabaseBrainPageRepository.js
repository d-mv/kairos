import { BrainPage } from "../../domain/brain-page/index.js";
function toBrainPage(row) {
    return BrainPage.reconstitute(row.id, {
        title: row.title,
        folderId: row.folder_id,
        contentJson: row.content_json,
        userId: row.user_id,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    });
}
export class SupabaseBrainPageRepository {
    client;
    shareRepo;
    constructor(client, shareRepo) {
        this.client = client;
        this.shareRepo = shareRepo;
    }
    async queryPagesByIds(ids) {
        if (ids.length === 0)
            return [];
        const { data, error } = await this.client.from("brain_pages").select("*").in("id", ids);
        if (error || !data)
            return [];
        return data.map(toBrainPage);
    }
    async queryPagesByFolderIds(folderIds) {
        if (folderIds.length === 0)
            return [];
        const { data, error } = await this.client
            .from("brain_pages")
            .select("*")
            .in("folder_id", folderIds);
        if (error || !data)
            return [];
        return data.map(toBrainPage);
    }
    dedupe(pages) {
        const seen = new Set();
        return pages.filter((page) => {
            if (seen.has(page.id))
                return false;
            seen.add(page.id);
            return true;
        });
    }
    async findById(id, userId) {
        const { data } = await this.client
            .from("brain_pages")
            .select("*")
            .eq("id", id)
            .eq("user_id", userId)
            .maybeSingle();
        if (data)
            return toBrainPage(data);
        const { data: sharedData, error } = await this.client
            .from("brain_pages")
            .select("*")
            .eq("id", id)
            .maybeSingle();
        if (error || !sharedData)
            return null;
        const row = sharedData;
        const [sharedPageIds, sharedFolderIds] = await Promise.all([
            this.shareRepo.findSharedEntityIds(userId, "brain_page"),
            this.shareRepo.findSharedEntityIds(userId, "brain_folder"),
        ]);
        if (sharedPageIds.includes(id) || (row.folder_id && sharedFolderIds.includes(row.folder_id))) {
            return toBrainPage(row);
        }
        return null;
    }
    async findAll(userId) {
        const { data, error } = await this.client
            .from("brain_pages")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: true });
        const ownPages = error || !data ? [] : data.map(toBrainPage);
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
    async findByFolderId(folderId, userId) {
        const { data } = await this.client
            .from("brain_pages")
            .select("*")
            .eq("folder_id", folderId)
            .eq("user_id", userId)
            .order("created_at", { ascending: true });
        const ownPages = data ? data.map(toBrainPage) : [];
        const sharedFolderIds = await this.shareRepo.findSharedEntityIds(userId, "brain_folder");
        if (!sharedFolderIds.includes(folderId))
            return ownPages;
        const { data: sharedData, error } = await this.client
            .from("brain_pages")
            .select("*")
            .eq("folder_id", folderId)
            .order("created_at", { ascending: true });
        if (error || !sharedData)
            return ownPages;
        return this.dedupe([...ownPages, ...sharedData.map(toBrainPage)]);
    }
    async save(page) {
        const { error } = await this.client.from("brain_pages").upsert({
            id: page.id,
            title: page.title,
            folder_id: page.folderId,
            content_json: page.contentJson,
            user_id: page.userId,
            created_at: page.createdAt.toISOString(),
            updated_at: page.updatedAt.toISOString(),
        });
        if (error)
            throw new Error(`Failed to save brain page: ${error.message}`);
    }
    async delete(id, userId) {
        const page = await this.findById(id, userId);
        if (!page)
            return;
        const { error } = await this.client
            .from("brain_pages")
            .delete()
            .eq("id", id)
            .eq("user_id", page.userId);
        if (error)
            throw new Error(`Failed to delete brain page: ${error.message}`);
    }
}
//# sourceMappingURL=SupabaseBrainPageRepository.js.map