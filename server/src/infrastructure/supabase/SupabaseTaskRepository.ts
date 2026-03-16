import type { SupabaseClient } from "@supabase/supabase-js";
import type { TaskStatus, TaskPriority, TaskDurationUnit } from "@kairos/shared";
import { Task } from "../../domain/task/index.js";
import type { TaskRepository } from "../../domain/task/index.js";
import type { CollaborationShareRepository } from "../../domain/collaboration/index.js";

interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: string;
  parent_task_id: string | null;
  project_id: string | null;
  area_id: string | null;
  user_id: string;
  due_date: string | null;
  duration: number | null;
  duration_unit: TaskDurationUnit | null;
  position: number;
  created_at: string;
  updated_at: string;
}

function toTask(row: TaskRow): Task {
  return Task.reconstitute(row.id, {
    title: row.title,
    description: row.description,
    status: row.status,
    priority: Number(row.priority) as TaskPriority,
    parentTaskId: row.parent_task_id,
    projectId: row.project_id,
    areaId: row.area_id,
    userId: row.user_id,
    dueDate: row.due_date ? new Date(row.due_date) : null,
    duration: row.duration,
    durationUnit: row.duration_unit,
    position: row.position ?? 0,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  });
}

export class SupabaseTaskRepository implements TaskRepository {
  constructor(
    private readonly client: SupabaseClient,
    private readonly shareRepo: CollaborationShareRepository,
  ) {}

  private async getSharedTaskIds(userId: string): Promise<string[]> {
    return this.shareRepo.findSharedEntityIds(userId, "task");
  }

  private async getSharedProjectIds(userId: string): Promise<string[]> {
    return this.shareRepo.findSharedEntityIds(userId, "project");
  }

  private async queryTasksByIds(ids: string[]): Promise<Task[]> {
    if (ids.length === 0) return [];
    const { data, error } = await this.client.from("tasks").select("*").in("id", ids);
    if (error || !data) return [];
    return (data as TaskRow[]).map(toTask);
  }

  private dedupe(tasks: Task[]): Task[] {
    const seen = new Set<string>();
    return tasks.filter((task) => {
      if (seen.has(task.id)) return false;
      seen.add(task.id);
      return true;
    });
  }

  async findById(id: string, userId: string): Promise<Task | null> {
    const { data } = await this.client
      .from("tasks")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();
    if (data) return toTask(data as TaskRow);

    const { data: accessibleData, error } = await this.client
      .from("tasks")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error || !accessibleData) return null;

    const row = accessibleData as TaskRow;
    const [sharedTaskIds, sharedProjectIds] = await Promise.all([
      this.getSharedTaskIds(userId),
      this.getSharedProjectIds(userId),
    ]);

    if (
      sharedTaskIds.includes(id) ||
      (row.project_id && sharedProjectIds.includes(row.project_id))
    ) {
      return toTask(row);
    }
    return null;
  }

  async findAll(userId: string): Promise<Task[]> {
    const { data, error } = await this.client
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .order("position", { ascending: true });
    const ownTasks = error || !data ? [] : (data as TaskRow[]).map(toTask);
    const [sharedTaskIds, sharedProjectIds] = await Promise.all([
      this.getSharedTaskIds(userId),
      this.getSharedProjectIds(userId),
    ]);
    const [sharedTasks, sharedProjectTasks] = await Promise.all([
      this.queryTasksByIds(sharedTaskIds),
      sharedProjectIds.length === 0
        ? Promise.resolve([] as Task[])
        : this.findTasksByProjectIds(sharedProjectIds),
    ]);
    return this.dedupe([...ownTasks, ...sharedTasks, ...sharedProjectTasks]);
  }

  private async findTasksByProjectIds(projectIds: string[]): Promise<Task[]> {
    const { data, error } = await this.client
      .from("tasks")
      .select("*")
      .in("project_id", projectIds)
      .order("position", { ascending: true });
    if (error || !data) return [];
    return (data as TaskRow[]).map(toTask);
  }

  async findByProjectId(projectId: string, userId: string): Promise<Task[]> {
    const { data } = await this.client
      .from("tasks")
      .select("*")
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .is("parent_task_id", null)
      .order("position", { ascending: true });
    const ownTasks = data ? (data as TaskRow[]).map(toTask) : [];
    const sharedProjectIds = await this.getSharedProjectIds(userId);
    if (!sharedProjectIds.includes(projectId)) return ownTasks;

    const { data: sharedData, error } = await this.client
      .from("tasks")
      .select("*")
      .eq("project_id", projectId)
      .is("parent_task_id", null)
      .order("position", { ascending: true });
    if (error || !sharedData) return ownTasks;
    return this.dedupe([...ownTasks, ...(sharedData as TaskRow[]).map(toTask)]);
  }

  async findByAreaId(areaId: string, userId: string): Promise<Task[]> {
    const { data, error } = await this.client
      .from("tasks")
      .select("*")
      .eq("area_id", areaId)
      .eq("user_id", userId)
      .order("position", { ascending: true });
    if (error || !data) return [];
    return (data as TaskRow[]).map(toTask);
  }

  async findInbox(userId: string): Promise<Task[]> {
    const { data, error } = await this.client
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .is("parent_task_id", null)
      .is("project_id", null)
      .is("area_id", null)
      .order("position", { ascending: true });
    const ownTasks = error || !data ? [] : (data as TaskRow[]).map(toTask);
    const sharedTasks = (await this.queryTasksByIds(await this.getSharedTaskIds(userId))).filter(
      (task) => !task.parentTaskId && !task.projectId && !task.areaId,
    );
    return this.dedupe([...ownTasks, ...sharedTasks]);
  }

  async findSubtasks(parentTaskId: string, userId: string): Promise<Task[]> {
    const parent = await this.findById(parentTaskId, userId);
    if (!parent) return [];

    const { data, error } = await this.client
      .from("tasks")
      .select("*")
      .eq("parent_task_id", parentTaskId)
      .order("position", { ascending: true });
    if (error || !data) return [];
    return (data as TaskRow[]).map(toTask);
  }

  async findSiblings(task: Task, userId: string): Promise<Task[]> {
    if (task.parentTaskId) return this.findSubtasks(task.parentTaskId, userId);
    if (task.projectId) return this.findByProjectId(task.projectId, userId);
    if (task.areaId) return this.findByAreaId(task.areaId, userId);
    return this.findInbox(userId);
  }

  async save(task: Task): Promise<void> {
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
      due_date: task.dueDate?.toISOString().split("T")[0] ?? null,
      duration: task.duration,
      duration_unit: task.durationUnit,
      position: task.position,
      created_at: task.createdAt.toISOString(),
      updated_at: task.updatedAt.toISOString(),
    });
    if (error) throw new Error(`Failed to save task: ${error.message}`);
  }

  async delete(id: string, userId: string): Promise<void> {
    const task = await this.findById(id, userId);
    if (!task) return;
    const { error } = await this.client
      .from("tasks")
      .delete()
      .eq("id", id)
      .eq("user_id", task.userId);
    if (error) throw new Error(`Failed to delete task: ${error.message}`);
  }
}
