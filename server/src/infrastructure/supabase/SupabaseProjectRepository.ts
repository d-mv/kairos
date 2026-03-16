import type { SupabaseClient } from "@supabase/supabase-js";
import { Project } from "../../domain/project/index.js";
import type { ProjectRepository } from "../../domain/project/index.js";

interface ProjectRow {
  id: string;
  name: string;
  area_id: string | null;
  completed_at: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

function toProject(row: ProjectRow): Project {
  return Project.reconstitute(row.id, {
    name: row.name,
    areaId: row.area_id,
    completedAt: row.completed_at ? new Date(row.completed_at) : null,
    userId: row.user_id,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  });
}

export class SupabaseProjectRepository implements ProjectRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: string, userId: string): Promise<Project | null> {
    const { data, error } = await this.client
      .from("projects")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();
    if (error || !data) return null;
    return toProject(data as ProjectRow);
  }

  async findAll(userId: string): Promise<Project[]> {
    const { data, error } = await this.client
      .from("projects")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (error || !data) return [];
    return (data as ProjectRow[]).map(toProject);
  }

  async findByAreaId(areaId: string, userId: string): Promise<Project[]> {
    const { data, error } = await this.client
      .from("projects")
      .select("*")
      .eq("area_id", areaId)
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (error || !data) return [];
    return (data as ProjectRow[]).map(toProject);
  }

  async save(project: Project): Promise<void> {
    const { error } = await this.client.from("projects").upsert({
      id: project.id,
      name: project.name,
      area_id: project.areaId,
      completed_at: project.completedAt?.toISOString() ?? null,
      user_id: project.userId,
      created_at: project.createdAt.toISOString(),
      updated_at: project.updatedAt.toISOString(),
    });
    if (error) throw new Error(`Failed to save project: ${error.message}`);
  }

  async delete(id: string, userId: string): Promise<void> {
    const { error } = await this.client
      .from("projects")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw new Error(`Failed to delete project: ${error.message}`);
  }
}
