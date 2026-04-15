function toDTO(row) {
    return {
        id: row.id,
        name: row.name,
        keyPreview: row.key_preview,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
export class SupabaseApiKeyRepository {
    client;
    constructor(client) {
        this.client = client;
    }
    async findUserIdByTokenHash(tokenHash) {
        const { data, error } = await this.client
            .from("api_keys")
            .select("user_id")
            .eq("token_hash", tokenHash)
            .maybeSingle();
        if (error || !data)
            return null;
        return data.user_id;
    }
    async listForUser(userId) {
        const { data, error } = await this.client
            .from("api_keys")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: true });
        if (error || !data)
            return [];
        return data.map(toDTO);
    }
    async createForUser(userId, name, tokenHash, keyPreview) {
        const { data, error } = await this.client
            .from("api_keys")
            .insert({ user_id: userId, name, token_hash: tokenHash, key_preview: keyPreview })
            .select("*")
            .single();
        if (error || !data) {
            throw new Error(`Failed to create API key: ${error?.message ?? "unknown error"}`);
        }
        return toDTO(data);
    }
    async deleteForUser(userId, id) {
        const { error } = await this.client
            .from("api_keys")
            .delete()
            .eq("id", id)
            .eq("user_id", userId);
        if (error) {
            throw new Error(`Failed to delete API key: ${error.message}`);
        }
    }
}
//# sourceMappingURL=SupabaseApiKeyRepository.js.map