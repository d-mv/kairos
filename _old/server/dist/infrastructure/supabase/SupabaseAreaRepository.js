import { Area } from "../../domain/area/index.js";
function toArea(row) {
    return Area.reconstitute(row.id, {
        name: row.name,
        userId: row.user_id,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    });
}
export class SupabaseAreaRepository {
    client;
    constructor(client) {
        this.client = client;
    }
    async findById(id, userId) {
        const { data, error } = await this.client
            .from("areas")
            .select("*")
            .eq("id", id)
            .eq("user_id", userId)
            .single();
        if (error || !data)
            return null;
        return toArea(data);
    }
    async findAll(userId) {
        const { data, error } = await this.client
            .from("areas")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: true });
        if (error || !data)
            return [];
        return data.map(toArea);
    }
    async save(area) {
        const { error } = await this.client.from("areas").upsert({
            id: area.id,
            name: area.name,
            user_id: area.userId,
            created_at: area.createdAt.toISOString(),
            updated_at: area.updatedAt.toISOString(),
        });
        if (error)
            throw new Error(`Failed to save area: ${error.message}`);
    }
    async delete(id, userId) {
        const { error } = await this.client.from("areas").delete().eq("id", id).eq("user_id", userId);
        if (error)
            throw new Error(`Failed to delete area: ${error.message}`);
    }
}
//# sourceMappingURL=SupabaseAreaRepository.js.map