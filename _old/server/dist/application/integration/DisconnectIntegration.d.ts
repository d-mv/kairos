import type { IntegrationConnectionProvider, IntegrationConnectionRepository } from "../../domain/integration/index.js";
export declare class DisconnectIntegration {
    private readonly repo;
    constructor(repo: IntegrationConnectionRepository);
    execute(userId: string, provider: IntegrationConnectionProvider): Promise<void>;
}
//# sourceMappingURL=DisconnectIntegration.d.ts.map