import type { SupabaseClient } from "@supabase/supabase-js";
import type { IntegrationConnection, IntegrationConnectionProvider, IntegrationConnectionRepository } from "../../domain/integration/index.js";
import { TokenCipher } from "../security/tokenCipher.js";
export declare class SupabaseIntegrationConnectionRepository implements IntegrationConnectionRepository {
    private readonly client;
    private readonly cipher;
    constructor(client: SupabaseClient, cipher: TokenCipher);
    findByProvider(userId: string, provider: IntegrationConnectionProvider): Promise<IntegrationConnection | null>;
    save(connection: IntegrationConnection): Promise<void>;
    delete(userId: string, provider: IntegrationConnectionProvider): Promise<void>;
}
//# sourceMappingURL=SupabaseIntegrationConnectionRepository.d.ts.map