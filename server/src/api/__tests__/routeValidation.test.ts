import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSignedJwt } from "./jwtTest.js";

const getUserMock = vi.fn();
const findUserIdByTokenHashMock = vi.fn();
const createTaskExecuteMock = vi.fn();
const updateProjectExecuteMock = vi.fn();
const reorderTaskExecuteMock = vi.fn();
const createCollaborationInviteExecuteMock = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: getUserMock,
    },
  })),
}));

vi.mock("@sentry/node", () => ({
  init: vi.fn(),
  withScope: vi.fn(
    (
      callback: (scope: {
        setTag: (key: string, value: string) => void;
        setContext: (name: string, context: Record<string, unknown>) => void;
        setUser: (user: { id: string }) => void;
      }) => void,
    ) =>
      callback({
        setTag: vi.fn(),
        setContext: vi.fn(),
        setUser: vi.fn(),
      }),
  ),
  captureException: vi.fn(),
  flush: vi.fn().mockResolvedValue(true),
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
  updateProject: { execute: updateProjectExecuteMock },
  deleteProject: { execute: vi.fn() },
  demoteProject: { execute: vi.fn() },
  listTasks: { execute: vi.fn() },
  createTask: { execute: createTaskExecuteMock },
  updateTask: { execute: vi.fn() },
  deleteTask: { execute: vi.fn() },
  completeTask: { execute: vi.fn() },
  reopenTask: { execute: vi.fn() },
  promoteTask: { execute: vi.fn() },
  reorderTask: { execute: reorderTaskExecuteMock },
  listBrainFolders: { execute: vi.fn() },
  listBrainPages: { execute: vi.fn() },
  createBrainFolder: { execute: vi.fn() },
  createBrainPage: { execute: vi.fn() },
  updateBrainPage: { execute: vi.fn() },
  deleteBrainPage: { execute: vi.fn() },
  createLink: { execute: vi.fn() },
  deleteLink: { execute: vi.fn() },
  listNotifications: { execute: vi.fn() },
  createCollaborationInvite: { execute: createCollaborationInviteExecuteMock },
}));

describe("route runtime validation", () => {
  const apps: Array<{ close: () => Promise<void> }> = [];
  const authToken = createSignedJwt({ sub: "auth-user-123", exp: 4102444800 });

  beforeEach(() => {
    vi.resetModules();
    getUserMock.mockReset();
    findUserIdByTokenHashMock.mockReset();
    createTaskExecuteMock.mockReset();
    updateProjectExecuteMock.mockReset();
    reorderTaskExecuteMock.mockReset();
    createCollaborationInviteExecuteMock.mockReset();

    getUserMock.mockResolvedValue({
      data: { user: null },
      error: new Error("Disabled in local JWT mode"),
    });
    findUserIdByTokenHashMock.mockResolvedValue(null);
    createTaskExecuteMock.mockResolvedValue({
      isErr: false,
      value: { id: "task-1" },
    });
    updateProjectExecuteMock.mockResolvedValue({
      isErr: false,
      value: { id: "project-1" },
    });
    reorderTaskExecuteMock.mockResolvedValue({
      isErr: false,
      value: { ok: true },
    });
    createCollaborationInviteExecuteMock.mockResolvedValue({
      isErr: false,
      value: { ok: true },
    });
  });

  afterEach(async () => {
    await Promise.all(apps.splice(0).map((app) => app.close()));
  });

  it("rejects invalid task create payloads before the use case runs", async () => {
    process.env["SUPABASE_URL"] ??= "https://example.supabase.co";
    process.env["SUPABASE_SERVICE_ROLE_KEY"] ??= "test-service-role-key";
    process.env["JWT_SECRET"] ??= "test-jwt-secret";

    const { buildApp } = await import("../buildApp.js");
    const app = await buildApp();
    apps.push(app);

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/tasks",
      headers: {
        authorization: `Bearer ${authToken}`,
      },
      payload: {
        title: "Bad priority task",
        priority: 9,
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: "Invalid task priority" });
    expect(createTaskExecuteMock).not.toHaveBeenCalled();
  });

  it("rejects invalid task move payloads before the use case runs", async () => {
    process.env["SUPABASE_URL"] ??= "https://example.supabase.co";
    process.env["SUPABASE_SERVICE_ROLE_KEY"] ??= "test-service-role-key";
    process.env["JWT_SECRET"] ??= "test-jwt-secret";

    const { buildApp } = await import("../buildApp.js");
    const app = await buildApp();
    apps.push(app);

    const response = await app.inject({
      method: "PUT",
      url: "/api/v1/tasks/task-1/move",
      headers: {
        authorization: `Bearer ${authToken}`,
      },
      payload: {
        afterId: 123,
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: "Invalid task move target" });
    expect(reorderTaskExecuteMock).not.toHaveBeenCalled();
  });

  it("rejects invalid project update payloads before the use case runs", async () => {
    process.env["SUPABASE_URL"] ??= "https://example.supabase.co";
    process.env["SUPABASE_SERVICE_ROLE_KEY"] ??= "test-service-role-key";
    process.env["JWT_SECRET"] ??= "test-jwt-secret";

    const { buildApp } = await import("../buildApp.js");
    const app = await buildApp();
    apps.push(app);

    const response = await app.inject({
      method: "PUT",
      url: "/api/v1/projects/project-1",
      headers: {
        authorization: `Bearer ${authToken}`,
      },
      payload: {
        completedAt: 123,
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: "Invalid project update payload" });
    expect(updateProjectExecuteMock).not.toHaveBeenCalled();
  });

  it("rejects invalid collaboration invites before the use case runs", async () => {
    process.env["SUPABASE_URL"] ??= "https://example.supabase.co";
    process.env["SUPABASE_SERVICE_ROLE_KEY"] ??= "test-service-role-key";
    process.env["JWT_SECRET"] ??= "test-jwt-secret";

    const { buildApp } = await import("../buildApp.js");
    const app = await buildApp();
    apps.push(app);

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/collaboration/invites",
      headers: {
        authorization: `Bearer ${authToken}`,
      },
      payload: {
        recipientEmail: "user@example.com",
        entityType: "workspace",
        entityId: "entity-1",
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ error: "Invalid collaboration invite payload" });
    expect(createCollaborationInviteExecuteMock).not.toHaveBeenCalled();
  });
});
