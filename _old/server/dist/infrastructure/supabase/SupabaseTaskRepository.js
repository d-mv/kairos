import { Task } from "../../domain/task/index.js";
function toTask(row) {
    return Task.reconstitute(row.id, {
        title: row.title,
        description: row.description,
        status: row.status,
        priority: Number(row.priority),
        parentTaskId: row.parent_task_id,
        projectId: row.project_id,
        areaId: row.area_id,
        userId: row.user_id,
        dueDate: row.due_date ? new Date(row.due_date) : null,
        duration: row.duration,
        durationUnit: row.duration_unit,
        tags: row.tags ?? [],
        position: row.position ?? 0,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
    });
}
export class SupabaseTaskRepository {
    client;
    shareRepo;
    constructor(client, shareRepo) {
        this.client = client;
        this.shareRepo = shareRepo;
    }
    async getSharedTaskIds(userId) {
        return this.shareRepo.findSharedEntityIds(userId, "task");
    }
    async getSharedProjectIds(userId) {
        return this.shareRepo.findSharedEntityIds(userId, "project");
    }
    async queryTasksByIds(ids) {
        if (ids.length === 0)
            return [];
        const { data, error } = await this.client.from("tasks").select("*").in("id", ids);
        if (error || !data)
            return [];
        return data.map(toTask);
    }
    dedupe(tasks) {
        const seen = new Set();
        return tasks.filter((task) => {
            if (seen.has(task.id))
                return false;
            seen.add(task.id);
            return true;
        });
    }
    async findById(id, userId) {
        const { data } = await this.client
            .from("tasks")
            .select("*")
            .eq("id", id)
            .eq("user_id", userId)
            .maybeSingle();
        if (data)
            return toTask(data);
        const { data: accessibleData, error } = await this.client
            .from("tasks")
            .select("*")
            .eq("id", id)
            .maybeSingle();
        if (error || !accessibleData)
            return null;
        const row = accessibleData;
        const [sharedTaskIds, sharedProjectIds] = await Promise.all([
            this.getSharedTaskIds(userId),
            this.getSharedProjectIds(userId),
        ]);
        if (sharedTaskIds.includes(id) ||
            (row.project_id && sharedProjectIds.includes(row.project_id))) {
            return toTask(row);
        }
        return null;
    }
    async findAll(userId) {
        const { data, error } = await this.client
            .from("tasks")
            .select("*")
            .eq("user_id", userId)
            .order("position", { ascending: true });
        const ownTasks = error || !data ? [] : data.map(toTask);
        const [sharedTaskIds, sharedProjectIds] = await Promise.all([
            this.getSharedTaskIds(userId),
            this.getSharedProjectIds(userId),
        ]);
        const [sharedTasks, sharedProjectTasks] = await Promise.all([
            this.queryTasksByIds(sharedTaskIds),
            sharedProjectIds.length === 0
                ? Promise.resolve([])
                : this.findTasksByProjectIds(sharedProjectIds),
        ]);
        return this.dedupe([...ownTasks, ...sharedTasks, ...sharedProjectTasks]);
    }
    async findTasksByProjectIds(projectIds) {
        const { data, error } = await this.client
            .from("tasks")
            .select("*")
            .in("project_id", projectIds)
            .order("position", { ascending: true });
        if (error || !data)
            return [];
        return data.map(toTask);
    }
    async findByProjectId(projectId, userId) {
        const { data } = await this.client
            .from("tasks")
            .select("*")
            .eq("project_id", projectId)
            .eq("user_id", userId)
            .is("parent_task_id", null)
            .order("position", { ascending: true });
        const ownTasks = data ? data.map(toTask) : [];
        const sharedProjectIds = await this.getSharedProjectIds(userId);
        if (!sharedProjectIds.includes(projectId))
            return ownTasks;
        const { data: sharedData, error } = await this.client
            .from("tasks")
            .select("*")
            .eq("project_id", projectId)
            .is("parent_task_id", null)
            .order("position", { ascending: true });
        if (error || !sharedData)
            return ownTasks;
        return this.dedupe([...ownTasks, ...sharedData.map(toTask)]);
    }
    async findByAreaId(areaId, userId) {
        const { data, error } = await this.client
            .from("tasks")
            .select("*")
            .eq("area_id", areaId)
            .eq("user_id", userId)
            .order("position", { ascending: true });
        if (error || !data)
            return [];
        return data.map(toTask);
    }
    async findInbox(userId) {
        const { data, error } = await this.client
            .from("tasks")
            .select("*")
            .eq("user_id", userId)
            .is("parent_task_id", null)
            .is("project_id", null)
            .is("area_id", null)
            .order("position", { ascending: true });
        const ownTasks = error || !data ? [] : data.map(toTask);
        const sharedTasks = (await this.queryTasksByIds(await this.getSharedTaskIds(userId))).filter((task) => !task.parentTaskId && !task.projectId && !task.areaId);
        return this.dedupe([...ownTasks, ...sharedTasks]);
    }
    async findSubtasks(parentTaskId, userId) {
        const parent = await this.findById(parentTaskId, userId);
        if (!parent)
            return [];
        const { data, error } = await this.client
            .from("tasks")
            .select("*")
            .eq("parent_task_id", parentTaskId)
            .order("position", { ascending: true });
        if (error || !data)
            return [];
        return data.map(toTask);
    }
    async findSiblings(task, userId) {
        if (task.parentTaskId)
            return this.findSubtasks(task.parentTaskId, userId);
        if (task.projectId)
            return this.findByProjectId(task.projectId, userId);
        if (task.areaId)
            return this.findByAreaId(task.areaId, userId);
        return this.findInbox(userId);
    }
    async save(task) {
        const { error } = await this.client.from("tasks").upsert({
            id: task.id,
            title: task.title,
            description: task.description,
            status: task.status,
            priority: String(task.priority),
            parent_task_id: task.parentTaskId,
            project_id: task.projectId,
            area_id: task.areaId,
            user_id: task.userId,
            due_date: task.dueDate?.toISOString() ?? null,
            duration: task.duration,
            duration_unit: task.durationUnit,
            tags: task.tags,
            position: task.position,
            created_at: task.createdAt.toISOString(),
            updated_at: task.updatedAt.toISOString(),
        });
        if (error)
            throw new Error(`Failed to save task: ${error.message}`);
    }
    async delete(id, userId) {
        const task = await this.findById(id, userId);
        if (!task)
            return;
        const { error } = await this.client
            .from("tasks")
            .delete()
            .eq("id", id)
            .eq("user_id", task.userId);
        if (error)
            throw new Error(`Failed to delete task: ${error.message}`);
    }
}
//# sourceMappingURL=SupabaseTaskRepository.js.map