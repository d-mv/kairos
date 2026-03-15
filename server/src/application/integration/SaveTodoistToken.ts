import { randomUUID } from "node:crypto";
import type { IntegrationConnectionRepository } from "../../domain/integration/index.js";

export class SaveTodoistToken {
  constructor(private readonly repo: IntegrationConnectionRepository) {}

  async execute(userId: string, token: string): Promise<void> {
    const existing = await this.repo.findByProvider(userId, "todoist");
    const now = new Date();

    await this.repo.save({
      id: existing?.id ?? randomUUID(),
      provider: "todoist",
      userId,
      accessToken: token,
      refreshToken: null,
      scopes: [],
      expiresAt: null,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });
  }
}
