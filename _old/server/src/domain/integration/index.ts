export type IntegrationConnectionProvider = "google" | "todoist";

export interface IntegrationConnection {
  id: string;
  provider: IntegrationConnectionProvider;
  userId: string;
  accessToken: string;
  refreshToken: string | null;
  scopes: string[];
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IntegrationConnectionRepository {
  findByProvider(
    userId: string,
    provider: IntegrationConnectionProvider,
  ): Promise<IntegrationConnection | null>;
  save(connection: IntegrationConnection): Promise<void>;
  delete(userId: string, provider: IntegrationConnectionProvider): Promise<void>;
}
