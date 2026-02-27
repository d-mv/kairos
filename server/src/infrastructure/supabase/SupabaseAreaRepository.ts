import type { SupabaseClient } from "@supabase/supabase-js";
import { Area } from "../../domain/area/index.js";
import type { AreaRepository } from "../../domain/area/index.js";

interface AreaRow {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

function toArea(row: AreaRow): Area {
  return Area.reconstitute(row.id, {
    name: row.name,
    userId: row.user_id,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  });
}

export class SupabaseAreaRepository implements AreaRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: string, userId: string): Promise<Area | null> {
    const { data, error } = await this.client
      .from("areas")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error || !data) return null;
    return toArea(data as AreaRow);
  }

  async findAll(userId: string): Promise<Area[]> {
    const { data, error } = await this.client
      .from("areas")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error || !data) return [];
    return (data as AreaRow[]).map(toArea);
  }

  async save(area: Area): Promise<void> {
    const { error } = await this.client.from("areas").upsert({
      id: area.id,
      name: area.name,
      user_id: area.userId,
      created_at: area.createdAt.toISOString(),
      updated_at: area.updatedAt.toISOString(),
    });
    if (error) throw new Error(`Failed to save area: ${error.message}`);
  }

  async delete(id: string, userId: string): Promise<void> {
    const { error } = await this.client.from("areas").delete().eq("id", id).eq("user_id", userId);
    if (error) throw new Error(`Failed to delete area: ${error.message}`);
  }
}
