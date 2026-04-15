import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  IntegrationConnection,
  IntegrationConnectionProvider,
  IntegrationConnectionRepository,
} from "../../domain/integration/index.js";
import { TokenCipher } from "../security/tokenCipher.js";

interface IntegrationConnectionRow {
  id: string;
  provider: IntegrationConnectionProvider;
  user_id: string;
  access_token_encrypted: string;
  refresh_token_encrypted: string | null;
  scopes: string[];
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

function toConnection(row: IntegrationConnectionRow, cipher: TokenCipher): IntegrationConnection {
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

export class SupabaseIntegrationConnectionRepository implements IntegrationConnectionRepository {
  constructor(
    private readonly client: SupabaseClient,
    private readonly cipher: TokenCipher,
  ) {}

  async findByProvider(
    userId: string,
    provider: IntegrationConnectionProvider,
  ): Promise<IntegrationConnection | null> {
    const { data, error } = await this.client
      .from("integration_connections")
      .select("*")
      .eq("user_id", userId)
      .eq("provider", provider)
      .maybeSingle();

    if (error || !data) return null;
    return toConnection(data as IntegrationConnectionRow, this.cipher);
  }

  async save(connection: IntegrationConnection): Promise<void> {
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

    if (error) throw new Error(`Failed to save integration connection: ${error.message}`);
  }

  async delete(userId: string, provider: IntegrationConnectionProvider): Promise<void> {
    const { error } = await this.client
      .from("integration_connections")
      .delete()
      .eq("user_id", userId)
      .eq("provider", provider);

    if (error) throw new Error(`Failed to delete integration connection: ${error.message}`);
  }
}
