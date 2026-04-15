import type { SupabaseClient } from "@supabase/supabase-js";
import { Task } from "../../domain/task/index.js";
import type { TaskRepository } from "../../domain/task/index.js";
import type { CollaborationShareRepository } from "../../domain/collaboration/index.js";
export declare class SupabaseTaskRepository implements TaskRepository {
    private readonly client;
    private readonly shareRepo;
    constructor(client: SupabaseClient, shareRepo: CollaborationShareRepository);
    private getSharedTaskIds;
    private getSharedProjectIds;
    private queryTasksByIds;
    private dedupe;
    findById(id: string, userId: string): Promise<Task | null>;
    findAll(userId: string): Promise<Task[]>;
    private findTasksByProjectIds;
    findByProjectId(projectId: string, userId: string): Promise<Task[]>;
    findByAreaId(areaId: string, userId: string): Promise<Task[]>;
    findInbox(userId: string): Promise<Task[]>;
    findSubtasks(parentTaskId: string, userId: string): Promise<Task[]>;
    findSiblings(task: Task, userId: string): Promise<Task[]>;
    save(task: Task): Promise<void>;
    delete(id: string, userId: string): Promise<void>;
}
//# sourceMappingURL=SupabaseTaskRepository.d.ts.map