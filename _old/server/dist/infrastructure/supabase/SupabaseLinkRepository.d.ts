import type { SupabaseClient } from "@supabase/supabase-js";
import { Link } from "../../domain/link/index.js";
import type { LinkRepository } from "../../domain/link/index.js";
export declare class SupabaseLinkRepository implements LinkRepository {
    private readonly client;
    constructor(client: SupabaseClient);
    findById(id: string, userId: string): Promise<Link | null>;
    findBySourceId(sourceId: string, userId: string): Promise<Link[]>;
    findByTargetId(targetId: string, userId: string): Promise<Link[]>;
    findByEntityId(entityId: string, userId: string): Promise<Link[]>;
    save(link: Link): Promise<void>;
    delete(id: string, userId: string): Promise<void>;
}
//# sourceMappingURL=SupabaseLinkRepository.d.ts.map