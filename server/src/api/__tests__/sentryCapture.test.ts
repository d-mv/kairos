import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getUserMock = vi.fn();
const findUserIdByTokenHashMock = vi.fn();
const captureServerExceptionMock = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: getUserMock,
    },
  })),
}));

vi.mock("../../observability/sentry.js", () => ({
  captureServerException: captureServerExceptionMock,
}));

vi.mock("../container.js", () => ({
  eventBus: {
    addClient: vi.fn(),
    removeClient: vi.fn(),
  },
  apiKeyRepo: {
    findUserIdByTokenHash: findUserIdByTokenHashMock,
    listForUser: vi.fn(),
    createForUser: vi.fn(),
    deleteForUser: vi.fn(),
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
  reorderTask: { execute: vi.fn() },
  promoteTask: { execute: vi.fn() },
  listBrainFolders: { execute: vi.fn() },
  listBrainPages: { execute: vi.fn() },
  createBrainFolder: { execute: vi.fn() },
  createBrainPage: { execute: vi.fn() },
  updateBrainPage: { execute: vi.fn() },
  deleteBrainPage: { execute: vi.fn() },
  createLink: { execute: vi.fn() },
  deleteLink: { execute: vi.fn() },
  listIntegrationStatuses: { execute: vi.fn() },
  getGoogleAuthUrl: { execute: vi.fn() },
  connectGoogleIntegration: { execute: vi.fn() },
  saveTodoistToken: { execute: vi.fn() },
  disconnectIntegration: { execute: vi.fn() },
  listNotifications: { execute: vi.fn() },
  acceptNotification: { execute: vi.fn() },
  declineNotification: { execute: vi.fn() },
  inviteCollaborator: { execute: vi.fn() },
}));

describe("backend sentry Fastify capture", () => {
  const apps: Array<{ close: () => Promise<void> }> = [];

  beforeEach(() => {
    vi.resetModules();
    getUserMock.mockReset();
    findUserIdByTokenHashMock.mockReset();
    captureServerExceptionMock.mockReset();

    getUserMock.mockResolvedValue({
      data: { user: null },
      error: new Error("Disabled in local JWT mode"),
    });
    findUserIdByTokenHashMock.mockResolvedValue(null);
  });

  afterEach(async () => {
    await Promise.all(apps.splice(0).map((app) => app.close()));
  });

  it("captures unhandled route errors", async () => {
    process.env["SUPABASE_URL"] ??= "https://example.supabase.co";
    process.env["SUPABASE_SERVICE_ROLE_KEY"] ??= "test-service-role-key";
    process.env["JWT_SECRET"] ??= "test-jwt-secret";

    const { buildApp } = await import("../buildApp.js");
    const app = await buildApp();
    app.get("/boom", { config: { skipAuth: true } }, async () => {
      throw new Error("boom");
    });
    apps.push(app);

    const response = await app.inject({
      method: "GET",
      url: "/boom",
    });

    expect(response.statusCode).toBe(500);
    expect(captureServerExceptionMock).toHaveBeenCalledTimes(1);
    expect(captureServerExceptionMock.mock.calls[0]?.[0]).toBeInstanceOf(Error);
    expect(captureServerExceptionMock.mock.calls[0]?.[1]).toMatchObject({
      method: "GET",
      url: "/boom",
    });
  });
});
