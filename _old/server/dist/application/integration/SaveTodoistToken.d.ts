import type { IntegrationConnectionRepository } from "../../domain/integration/index.js";
export declare class SaveTodoistToken {
    private readonly repo;
    constructor(repo: IntegrationConnectionRepository);
    execute(userId: string, token: string): Promise<void>;
}
//# sourceMappingURL=SaveTodoistToken.d.ts.map