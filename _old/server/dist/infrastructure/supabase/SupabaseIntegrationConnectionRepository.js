function toConnection(row, cipher) {
    return {
        id: row.id,
        provider: row.provider,
        userId: row.user_id,
        accessToken: cipher.decrypt(row.access_token_encrypted),
        refreshToken: row.refresh_token_encrypted ? cipher.decrypt(row.refresh_token_encrypted) : null,
        scopes: row.scopes ?? [],
        expiresAt: row.expires_at ? new Date(row.expires_at) : null,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    };
}
export class SupabaseIntegrationConnectionRepository {
    client;
    cipher;
    constructor(client, cipher) {
        this.client = client;
        this.cipher = cipher;
    }
    async findByProvider(userId, provider) {
        const { data, error } = await this.client
            .from("integration_connections")
            .select("*")
            .eq("user_id", userId)
            .eq("provider", provider)
            .maybeSingle();
        if (error || !data)
            return null;
        return toConnection(data, this.cipher);
    }
    async save(connection) {
        const { error } = await this.client.from("integration_connections").upsert({
            id: connection.id,
            provider: connection.provider,
            user_id: connection.userId,
            access_token_encrypted: this.cipher.encrypt(connection.accessToken),
            refresh_token_encrypted: connection.refreshToken
                ? this.cipher.encrypt(connection.refreshToken)
                : null,
            scopes: connection.scopes,
            expires_at: connection.expiresAt?.toISOString() ?? null,
            created_at: connection.createdAt.toISOString(),
            updated_at: connection.updatedAt.toISOString(),
        });
        if (error)
            throw new Error(`Failed to save integration connection: ${error.message}`);
    }
    async delete(userId, provider) {
        const { error } = await this.client
            .from("integration_connections")
            .delete()
            .eq("user_id", userId)
            .eq("provider", provider);
        if (error)
            throw new Error(`Failed to delete integration connection: ${error.message}`);
    }
}
//# sourceMappingURL=SupabaseIntegrationConnectionRepository.js.map