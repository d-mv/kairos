function toShare(row) {
    return {
        id: row.id,
        entityType: row.entity_type,
        entityId: row.entity_id,
        ownerUserId: row.owner_user_id,
        collaboratorUserId: row.collaborator_user_id,
        createdAt: new Date(row.created_at),
    };
}
export class SupabaseCollaborationShareRepository {
    client;
    constructor(client) {
        this.client = client;
    }
    async findSharedEntityIds(userId, entityType) {
        const { data, error } = await this.client
            .from("collaboration_shares")
            .select("entity_id")
            .eq("collaborator_user_id", userId)
            .eq("entity_type", entityType);
        if (error || !data)
            return [];
        return data.map((row) => row.entity_id);
    }
    async findShare(userId, entityType, entityId) {
        const { data, error } = await this.client
            .from("collaboration_shares")
            .select("*")
            .eq("collaborator_user_id", userId)
            .eq("entity_type", entityType)
            .eq("entity_id", entityId)
            .maybeSingle();
        if (error || !data)
            return null;
        return toShare(data);
    }
    async save(share) {
        const { error } = await this.client.from("collaboration_shares").upsert({
            id: share.id,
            entity_type: share.entityType,
            entity_id: share.entityId,
            owner_user_id: share.ownerUserId,
            collaborator_user_id: share.collaboratorUserId,
            created_at: share.createdAt.toISOString(),
        });
        if (error)
            throw new Error(`Failed to save collaboration share: ${error.message}`);
    }
}
//# sourceMappingURL=SupabaseCollaborationShareRepository.js.map