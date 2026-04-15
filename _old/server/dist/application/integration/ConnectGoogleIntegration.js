import { randomUUID } from "node:crypto";
export class ConnectGoogleIntegration {
    repo;
    googleOAuth;
    constructor(repo, googleOAuth) {
        this.repo = repo;
        this.googleOAuth = googleOAuth;
    }
    async execute(code, state) {
        try {
            const connection = await this.googleOAuth.exchangeCodeForConnection(code, state);
            const existing = await this.repo.findByProvider(connection.userId, "google");
            const createdAt = existing?.createdAt ?? new Date();
            await this.repo.save({
                id: existing?.id ?? randomUUID(),
                provider: "google",
                userId: connection.userId,
                accessToken: connection.accessToken,
                refreshToken: connection.refreshToken,
                scopes: connection.scopes,
                expiresAt: connection.expiresAt,
                createdAt,
                updatedAt: new Date(),
            });
            return this.googleOAuth.getClientRedirectUrl("success");
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Google connection failed";
            return this.googleOAuth.getClientRedirectUrl("error", "google", message);
        }
    }
}
//# sourceMappingURL=ConnectGoogleIntegration.js.map