import type {
  IntegrationConnectionProvider,
  IntegrationConnectionRepository,
} from "../../domain/integration/index.js";

export class DisconnectIntegration {
  constructor(private readonly repo: IntegrationConnectionRepository) {}

  async execute(userId: string, provider: IntegrationConnectionProvider): Promise<void> {
    await this.repo.delete(userId, provider);
  }
}
