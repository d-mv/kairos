import type { SupabaseClient } from "@supabase/supabase-js";

export interface ApiKeyRecord {
  keyPreview: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiKeyRow {
  user_id: string;
  token_hash: string;
  key_preview: string;
  created_at: string;
  updated_at: string;
}

function toRecord(row: ApiKeyRow): ApiKeyRecord {
  return {
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

  async getForUser(userId: string): Promise<ApiKeyRecord | null> {
    const { data, error } = await this.client
      .from("api_keys")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) return null;
    return toRecord(data as ApiKeyRow);
  }

  async rotateForUser(userId: string, tokenHash: string, keyPreview: string): Promise<ApiKeyRecord> {
    const payload = {
      user_id: userId,
      token_hash: tokenHash,
      key_preview: keyPreview,
    };

    const { data, error } = await this.client
      .from("api_keys")
      .upsert(payload, { onConflict: "user_id" })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(`Failed to rotate API key: ${error?.message ?? "unknown error"}`);
    }

    return toRecord(data as ApiKeyRow);
  }
}
