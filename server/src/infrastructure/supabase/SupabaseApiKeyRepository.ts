import type { SupabaseClient } from "@supabase/supabase-js";
import type { ApiKeyDTO } from "@kairos/shared";

interface ApiKeyRow {
  id: string;
  user_id: string;
  name: string;
  token_hash: string;
  key_preview: string;
  created_at: string;
  updated_at: string;
}

function toDTO(row: ApiKeyRow): ApiKeyDTO {
  return {
    id: row.id,
    name: row.name,
    keyPreview: row.key_preview,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SupabaseApiKeyRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findUserIdByTokenHash(tokenHash: string): Promise<string | null> {
    const { data, error } = await this.client
      .from("api_keys")
      .select("user_id")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (error || !data) return null;
    return (data as { user_id: string }).user_id;
  }

  async listForUser(userId: string): Promise<ApiKeyDTO[]> {
    const { data, error } = await this.client
      .from("api_keys")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error || !data) return [];
    return (data as ApiKeyRow[]).map(toDTO);
  }

  async createForUser(
    userId: string,
    name: string,
    tokenHash: string,
    keyPreview: string,
  ): Promise<ApiKeyDTO> {
    const { data, error } = await this.client
      .from("api_keys")
      .insert({ user_id: userId, name, token_hash: tokenHash, key_preview: keyPreview })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(`Failed to create API key: ${error?.message ?? "unknown error"}`);
    }

    return toDTO(data as ApiKeyRow);
  }

  async deleteForUser(userId: string, id: string): Promise<void> {
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
