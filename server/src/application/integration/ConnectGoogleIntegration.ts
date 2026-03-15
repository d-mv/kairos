import { randomUUID } from "node:crypto";
import type { IntegrationConnectionRepository } from "../../domain/integration/index.js";
import { GoogleOAuthService } from "./GoogleOAuthService.js";

export class ConnectGoogleIntegration {
  constructor(
    private readonly repo: IntegrationConnectionRepository,
    private readonly googleOAuth: GoogleOAuthService,
  ) {}

  async execute(code: string, state: string): Promise<string> {
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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Google connection failed";
      return this.googleOAuth.getClientRedirectUrl("error", "google", message);
    }
  }
}
