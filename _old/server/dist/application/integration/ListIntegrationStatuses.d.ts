import type { IntegrationStatusDTO } from "@kairos/shared";
import type { IntegrationConnectionRepository } from "../../domain/integration/index.js";
export declare class ListIntegrationStatuses {
    private readonly repo;
    constructor(repo: IntegrationConnectionRepository);
    execute(userId: string): Promise<IntegrationStatusDTO[]>;
}
//# sourceMappingURL=ListIntegrationStatuses.d.ts.map