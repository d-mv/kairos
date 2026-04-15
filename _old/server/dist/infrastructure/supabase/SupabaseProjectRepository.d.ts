import type { SupabaseClient } from "@supabase/supabase-js";
import { Project } from "../../domain/project/index.js";
import type { ProjectRepository } from "../../domain/project/index.js";
import type { CollaborationShareRepository } from "../../domain/collaboration/index.js";
export declare class SupabaseProjectRepository implements ProjectRepository {
    private readonly client;
    private readonly shareRepo;
    constructor(client: SupabaseClient, shareRepo: CollaborationShareRepository);
    findById(id: string, userId: string): Promise<Project | null>;
    findAll(userId: string): Promise<Project[]>;
    findByAreaId(areaId: string, userId: string): Promise<Project[]>;
    save(project: Project): Promise<void>;
    delete(id: string, userId: string): Promise<void>;
}
//# sourceMappingURL=SupabaseProjectRepository.d.ts.map