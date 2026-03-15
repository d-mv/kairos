import type { IntegrationStatusDTO } from "@kairos/shared";
import type { IntegrationConnectionRepository } from "../../domain/integration/index.js";

export class ListIntegrationStatuses {
  constructor(private readonly repo: IntegrationConnectionRepository) {}

  async execute(userId: string): Promise<IntegrationStatusDTO[]> {
    const [googleConnection, todoistConnection] = await Promise.all([
      this.repo.findByProvider(userId, "google"),
      this.repo.findByProvider(userId, "todoist"),
    ]);

    const googleConnectedAt = googleConnection?.createdAt.toISOString() ?? null;

    return [
      {
        provider: "google_calendar",
        connected: Boolean(googleConnection),
        connectedAt: googleConnectedAt,
      },
      {
        provider: "google_drive",
        connected: Boolean(googleConnection),
        connectedAt: googleConnectedAt,
      },
      {
        provider: "todoist",
        connected: Boolean(todoistConnection),
        connectedAt: todoistConnection?.createdAt.toISOString() ?? null,
      },
    ];
  }
}
