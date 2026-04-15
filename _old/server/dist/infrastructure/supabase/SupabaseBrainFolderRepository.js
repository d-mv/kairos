import { BrainFolder } from "../../domain/brain-folder/index.js";
function toBrainFolder(row) {
    return BrainFolder.reconstitute(row.id, {
        name: row.name,
        userId: row.user_id,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    });
}
export class SupabaseBrainFolderRepository {
    client;
    shareRepo;
    constructor(client, shareRepo) {
        this.client = client;
        this.shareRepo = shareRepo;
    }
    async findById(id, userId) {
        const { data } = await this.client
            .from("brain_folders")
            .select("*")
            .eq("id", id)
            .eq("user_id", userId)
            .maybeSingle();
        if (data)
            return toBrainFolder(data);
        const share = await this.shareRepo.findShare(userId, "brain_folder", id);
        if (!share)
            return null;
        const { data: sharedData, error } = await this.client
            .from("brain_folders")
            .select("*")
            .eq("id", id)
            .maybeSingle();
        if (error || !sharedData)
            return null;
        return toBrainFolder(sharedData);
    }
    async findAll(userId) {
        const { data, error } = await this.client
            .from("brain_folders")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: true });
        const ownFolders = error || !data ? [] : data.map(toBrainFolder);
        const sharedIds = await this.shareRepo.findSharedEntityIds(userId, "brain_folder");
        if (sharedIds.length === 0)
            return ownFolders;
        const { data: sharedData, error: sharedError } = await this.client
            .from("brain_folders")
            .select("*")
            .in("id", sharedIds)
            .order("created_at", { ascending: true });
        if (sharedError || !sharedData)
            return ownFolders;
        return [...ownFolders, ...sharedData.map(toBrainFolder)];
    }
    async save(folder) {
        const { error } = await this.client.from("brain_folders").upsert({
            id: folder.id,
            name: folder.name,
            user_id: folder.userId,
            created_at: folder.createdAt.toISOString(),
            updated_at: folder.updatedAt.toISOString(),
        });
        if (error)
            throw new Error(`Failed to save brain folder: ${error.message}`);
    }
    async delete(id, userId) {
        const folder = await this.findById(id, userId);
        if (!folder)
            return;
        const { error } = await this.client
            .from("brain_folders")
            .delete()
            .eq("id", id)
            .eq("user_id", folder.userId);
        if (error)
            throw new Error(`Failed to delete brain folder: ${error.message}`);
    }
}
//# sourceMappingURL=SupabaseBrainFolderRepository.js.map