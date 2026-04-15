import type { SupabaseClient } from "@supabase/supabase-js";
import type { ApiKeyDTO } from "@kairos/shared";
export declare class SupabaseApiKeyRepository {
    private readonly client;
    constructor(client: SupabaseClient);
    findUserIdByTokenHash(tokenHash: string): Promise<string | null>;
    listForUser(userId: string): Promise<ApiKeyDTO[]>;
    createForUser(userId: string, name: string, tokenHash: string, keyPreview: string): Promise<ApiKeyDTO>;
    deleteForUser(userId: string, id: string): Promise<void>;
}
//# sourceMappingURL=SupabaseApiKeyRepository.d.ts.map