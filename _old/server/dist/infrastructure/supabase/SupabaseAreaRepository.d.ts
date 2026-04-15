import type { SupabaseClient } from "@supabase/supabase-js";
import { Area } from "../../domain/area/index.js";
import type { AreaRepository } from "../../domain/area/index.js";
export declare class SupabaseAreaRepository implements AreaRepository {
    private readonly client;
    constructor(client: SupabaseClient);
    findById(id: string, userId: string): Promise<Area | null>;
    findAll(userId: string): Promise<Area[]>;
    save(area: Area): Promise<void>;
    delete(id: string, userId: string): Promise<void>;
}
//# sourceMappingURL=SupabaseAreaRepository.d.ts.map