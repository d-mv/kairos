import type { IntegrationConnectionRepository } from "../../domain/integration/index.js";
import { GoogleOAuthService } from "./GoogleOAuthService.js";
export declare class ConnectGoogleIntegration {
    private readonly repo;
    private readonly googleOAuth;
    constructor(repo: IntegrationConnectionRepository, googleOAuth: GoogleOAuthService);
    execute(code: string, state: string): Promise<string>;
}
//# sourceMappingURL=ConnectGoogleIntegration.d.ts.map