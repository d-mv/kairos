import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserDirectory, UserDirectoryEntry } from "../../domain/collaboration/index.js";
export declare class SupabaseUserDirectory implements UserDirectory {
    private readonly client;
    constructor(client: SupabaseClient);
    findById(id: string): Promise<UserDirectoryEntry | null>;
    findByEmail(email: string): Promise<UserDirectoryEntry | null>;
}
//# sourceMappingURL=SupabaseUserDirectory.d.ts.map