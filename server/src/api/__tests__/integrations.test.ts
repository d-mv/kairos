import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getUserMock = vi.fn();
const findUserIdByTokenHashMock = vi.fn();
const listIntegrationStatusesExecuteMock = vi.fn();
const getGoogleAuthUrlExecuteMock = vi.fn();
const connectGoogleIntegrationExecuteMock = vi.fn();
const saveTodoistTokenExecuteMock = vi.fn();
const disconnectIntegrationExecuteMock = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: getUserMock,
    },
  })),
}));

vi.mock("../container.js", () => ({
  eventBus: {
    addClient: vi.fn(),
    removeClient: vi.fn(),
  },
  apiKeyRepo: {
    findUserIdByTokenHash: findUserIdByTokenHashMock,
    rotateForUser: vi.fn(),
    getForUser: vi.fn(),
  },
  listAreas: { execute: vi.fn() },
  createArea: { execute: vi.fn() },
  updateArea: { execute: vi.fn() },
  deleteArea: { execute: vi.fn() },
  listProjects: { execute: vi.fn() },
  createProject: { execute: vi.fn() },
  updateProject: { execute: vi.fn() },
  deleteProject: { execute: vi.fn() },
  demoteProject: { execute: vi.fn() },
  listTasks: { execute: vi.fn() },
  createTask: { execute: vi.fn() },
  updateTask: { execute: vi.fn() },
  deleteTask: { execute: vi.fn() },
  completeTask: { execute: vi.fn() },
  reopenTask: { execute: vi.fn() },
  promoteTask: { execute: vi.fn() },
  reorderTask: { execute: vi.fn() },
  listBrainFolders: { execute: vi.fn() },
  listBrainPages: { execute: vi.fn() },
  createBrainFolder: { execute: vi.fn() },
  createBrainPage: { execute: vi.fn() },
  updateBrainPage: { execute: vi.fn() },
  createLink: { execute: vi.fn() },
  deleteLink: { execute: vi.fn() },
  listIntegrationStatuses: { execute: listIntegrationStatusesExecuteMock },
  getGoogleAuthUrl: { execute: getGoogleAuthUrlExecuteMock },
  connectGoogleIntegration: { execute: connectGoogleIntegrationExecuteMock },
  saveTodoistToken: { execute: saveTodoistTokenExecuteMock },
  disconnectIntegration: { execute: disconnectIntegrationExecuteMock },
}));

describe("integration routes", () => {
  const apps: Array<{ close: () => Promise<void> }> = [];

  beforeEach(() => {
    vi.resetModules();
    getUserMock.mockReset();
    findUserIdByTokenHashMock.mockReset();
    listIntegrationStatusesExecuteMock.mockReset();
    getGoogleAuthUrlExecuteMock.mockReset();
    connectGoogleIntegrationExecuteMock.mockReset();
    saveTodoistTokenExecuteMock.mockReset();
    disconnectIntegrationExecuteMock.mockReset();

    getUserMock.mockImplementation(async (token: string) => {
      if (token === "valid-token") {
        return { data: { user: { id: "auth-user-123" } }, error: null };
      }

      return { data: { user: null }, error: new Error("Invalid token") };
    });

    findUserIdByTokenHashMock.mockResolvedValue(null);
    listIntegrationStatusesExecuteMock.mockResolvedValue([
      { provider: "google_calendar", connected: true, connectedAt: "2026-03-15T00:00:00.000Z" },
      { provider: "google_drive", connected: true, connectedAt: "2026-03-15T00:00:00.000Z" },
      { provider: "todoist", connected: false, connectedAt: null },
    ]);
    getGoogleAuthUrlExecuteMock.mockResolvedValue(
      "https://accounts.google.com/o/oauth2/v2/auth?state=test",
    );
    connectGoogleIntegrationExecuteMock.mockResolvedValue(
      "https://kairos-web.fly.dev/inbox?dialog=settings&tab=integrations&provider=google&status=success",
    );
    saveTodoistTokenExecuteMock.mockResolvedValue(undefined);
    disconnectIntegrationExecuteMock.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    await Promise.all(apps.splice(0).map((app) => app.close()));
  });

  it("lists integration statuses for the authenticated user", async () => {
    process.env["SUPABASE_URL"] ??= "https://example.supabase.co";
    process.env["SUPABASE_SERVICE_ROLE_KEY"] ??= "test-service-role-key";

    const { buildApp } = await import("../buildApp.js");
    const app = await buildApp();
    apps.push(app);

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/integrations",
      headers: {
        authorization: "Bearer valid-token",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([
      { provider: "google_calendar", connected: true, connectedAt: "2026-03-15T00:00:00.000Z" },
      { provider: "google_drive", connected: true, connectedAt: "2026-03-15T00:00:00.000Z" },
      { provider: "todoist", connected: false, connectedAt: null },
    ]);
    expect(listIntegrationStatusesExecuteMock).toHaveBeenCalledWith("auth-user-123");
  });

  it("returns a Google auth url for the authenticated user", async () => {
    process.env["SUPABASE_URL"] ??= "https://example.supabase.co";
    process.env["SUPABASE_SERVICE_ROLE_KEY"] ??= "test-service-role-key";

    const { buildApp } = await import("../buildApp.js");
    const app = await buildApp();
    apps.push(app);

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/integrations/google/start",
      headers: {
        authorization: "Bearer valid-token",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      url: "https://accounts.google.com/o/oauth2/v2/auth?state=test",
    });
    expect(getGoogleAuthUrlExecuteMock).toHaveBeenCalledWith("auth-user-123");
  });

  it("stores a user-provided Todoist token", async () => {
    process.env["SUPABASE_URL"] ??= "https://example.supabase.co";
    process.env["SUPABASE_SERVICE_ROLE_KEY"] ??= "test-service-role-key";

    const { buildApp } = await import("../buildApp.js");
    const app = await buildApp();
    apps.push(app);

    const response = await app.inject({
      method: "PUT",
      url: "/api/v1/integrations/todoist/token",
      headers: {
        authorization: "Bearer valid-token",
      },
      payload: {
        token: "todoist-api-token",
      },
    });

    expect(response.statusCode).toBe(204);
    expect(saveTodoistTokenExecuteMock).toHaveBeenCalledWith("auth-user-123", "todoist-api-token");
  });

  it("disconnects an integration for the authenticated user", async () => {
    process.env["SUPABASE_URL"] ??= "https://example.supabase.co";
    process.env["SUPABASE_SERVICE_ROLE_KEY"] ??= "test-service-role-key";

    const { buildApp } = await import("../buildApp.js");
    const app = await buildApp();
    apps.push(app);

    const response = await app.inject({
      method: "DELETE",
      url: "/api/v1/integrations/google",
      headers: {
        authorization: "Bearer valid-token",
      },
    });

    expect(response.statusCode).toBe(204);
    expect(disconnectIntegrationExecuteMock).toHaveBeenCalledWith("auth-user-123", "google");
  });

  it("handles the Google callback without bearer auth and redirects back to the client", async () => {
    process.env["SUPABASE_URL"] ??= "https://example.supabase.co";
    process.env["SUPABASE_SERVICE_ROLE_KEY"] ??= "test-service-role-key";

    const { buildApp } = await import("../buildApp.js");
    const app = await buildApp();
    apps.push(app);

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/integrations/google/callback?code=test-code&state=test-state",
    });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe(
      "https://kairos-web.fly.dev/inbox?dialog=settings&tab=integrations&provider=google&status=success",
    );
    expect(connectGoogleIntegrationExecuteMock).toHaveBeenCalledWith("test-code", "test-state");
  });
});
