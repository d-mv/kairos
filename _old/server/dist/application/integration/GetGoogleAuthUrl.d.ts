import { GoogleOAuthService } from "./GoogleOAuthService.js";
export declare class GetGoogleAuthUrl {
    private readonly googleOAuth;
    constructor(googleOAuth: GoogleOAuthService);
    execute(userId: string): Promise<string>;
}
//# sourceMappingURL=GetGoogleAuthUrl.d.ts.map