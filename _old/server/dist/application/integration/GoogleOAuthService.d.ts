import { TokenCipher } from "../../infrastructure/security/tokenCipher.js";
type GoogleOAuthConfig = {
    clientId: string;
    clientSecret: string;
    clientUrl: string;
    serverUrl: string;
};
export type GoogleConnectionPayload = {
    userId: string;
    accessToken: string;
    refreshToken: string | null;
    expiresAt: Date | null;
    scopes: string[];
};
export declare class GoogleOAuthService {
    private readonly cipher;
    private readonly config;
    constructor(cipher: TokenCipher, config: GoogleOAuthConfig);
    getAuthorizationUrl(userId: string): string;
    exchangeCodeForConnection(code: string, state: string): Promise<GoogleConnectionPayload>;
    getClientRedirectUrl(status: "success" | "error", provider?: string, error?: string): string;
    private getRedirectUri;
    private createSignedState;
    private parseSignedState;
}
export {};
//# sourceMappingURL=GoogleOAuthService.d.ts.map