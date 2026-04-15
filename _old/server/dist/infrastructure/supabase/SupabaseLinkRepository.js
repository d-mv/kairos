import { Link } from "../../domain/link/index.js";
function toLink(row) {
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
export class SupabaseLinkRepository {
    client;
    constructor(client) {
        this.client = client;
    }
    async findById(id, userId) {
        const { data, error } = await this.client
            .from("links")
            .select("*")
            .eq("id", id)
            .eq("user_id", userId)
            .single();
        if (error || !data)
            return null;
        return toLink(data);
    }
    async findBySourceId(sourceId, userId) {
        const { data, error } = await this.client
            .from("links")
            .select("*")
            .eq("source_id", sourceId)
            .eq("user_id", userId);
        if (error || !data)
            return [];
        return data.map(toLink);
    }
    async findByTargetId(targetId, userId) {
        const { data, error } = await this.client
            .from("links")
            .select("*")
            .eq("target_id", targetId)
            .eq("user_id", userId);
        if (error || !data)
            return [];
        return data.map(toLink);
    }
    async findByEntityId(entityId, userId) {
        const { data, error } = await this.client
            .from("links")
            .select("*")
            .eq("user_id", userId)
            .or(`source_id.eq.${entityId},target_id.eq.${entityId}`);
        if (error || !data)
            return [];
        return data.map(toLink);
    }
    async save(link) {
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
        if (error)
            throw new Error(`Failed to save link: ${error.message}`);
    }
    async delete(id, userId) {
        const { error } = await this.client.from("links").delete().eq("id", id).eq("user_id", userId);
        if (error)
            throw new Error(`Failed to delete link: ${error.message}`);
    }
}
//# sourceMappingURL=SupabaseLinkRepository.js.map