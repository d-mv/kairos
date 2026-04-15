import { Project } from "../../domain/project/index.js";
function toProject(row) {
    return Project.reconstitute(row.id, {
        name: row.name,
        areaId: row.area_id,
        completedAt: row.completed_at ? new Date(row.completed_at) : null,
        userId: row.user_id,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    });
}
export class SupabaseProjectRepository {
    client;
    shareRepo;
    constructor(client, shareRepo) {
        this.client = client;
        this.shareRepo = shareRepo;
    }
    async findById(id, userId) {
        const { data } = await this.client
            .from("projects")
            .select("*")
            .eq("id", id)
            .eq("user_id", userId)
            .maybeSingle();
        if (data)
            return toProject(data);
        const share = await this.shareRepo.findShare(userId, "project", id);
        if (!share)
            return null;
        const { data: sharedData, error } = await this.client
            .from("projects")
            .select("*")
            .eq("id", id)
            .maybeSingle();
        if (error || !sharedData)
            return null;
        return toProject(sharedData);
    }
    async findAll(userId) {
        const { data, error } = await this.client
            .from("projects")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: true });
        const ownProjects = error || !data ? [] : data.map((row) => toProject(row));
        const sharedIds = await this.shareRepo.findSharedEntityIds(userId, "project");
        if (sharedIds.length === 0)
            return ownProjects;
        const { data: sharedData, error: sharedError } = await this.client
            .from("projects")
            .select("*")
            .in("id", sharedIds)
            .order("created_at", { ascending: true });
        if (sharedError || !sharedData)
            return ownProjects;
        const sharedProjects = sharedData.map((row) => toProject(row));
        return [...ownProjects, ...sharedProjects.filter((row) => row.userId !== userId)];
    }
    async findByAreaId(areaId, userId) {
        const { data, error } = await this.client
            .from("projects")
            .select("*")
            .eq("area_id", areaId)
            .eq("user_id", userId)
            .order("created_at", { ascending: true });
        if (error || !data)
            return [];
        return data.map(toProject);
    }
    async save(project) {
        const { error } = await this.client.from("projects").upsert({
            id: project.id,
            name: project.name,
            area_id: project.areaId,
            completed_at: project.completedAt?.toISOString() ?? null,
            user_id: project.userId,
            created_at: project.createdAt.toISOString(),
            updated_at: project.updatedAt.toISOString(),
        });
        if (error)
            throw new Error(`Failed to save project: ${error.message}`);
    }
    async delete(id, userId) {
        const project = await this.findById(id, userId);
        if (!project)
            return;
        const { error } = await this.client
            .from("projects")
            .delete()
            .eq("id", id)
            .eq("user_id", project.userId);
        if (error)
            throw new Error(`Failed to delete project: ${error.message}`);
    }
}
//# sourceMappingURL=SupabaseProjectRepository.js.map