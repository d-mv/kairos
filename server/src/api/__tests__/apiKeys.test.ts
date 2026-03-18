import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getUserMock = vi.fn();
const findUserIdByTokenHashMock = vi.fn();
const listForUserMock = vi.fn();
const createForUserMock = vi.fn();
const deleteForUserMock = vi.fn();

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
    listForUser: listForUserMock,
    createForUser: createForUserMock,
    deleteForUser: deleteForUserMock,
  },
  listAreas: { execute: vi.fn() },
  createArea: { execute: vi.fn() },
  updateArea: { execute: vi.fn() },
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
  promoteTask: { execute: vi.fn() },
  createLink: { execute: vi.fn() },
  deleteLink: { execute: vi.fn() },
}));

const CREATED_AT = "2026-03-02T00:00:00.000Z";

describe("API key routes", () => {
  const apps: Array<{ close: () => Promise<void> }> = [];

  beforeEach(() => {
    vi.resetModules();
    getUserMock.mockReset();
    findUserIdByTokenHashMock.mockReset();
    listForUserMock.mockReset();
    createForUserMock.mockReset();
    deleteForUserMock.mockReset();

    getUserMock.mockImplementation(async (token: string) => {
      if (token === "valid-token") {
        return { data: { user: { id: "auth-user-123" } }, error: null };
      }
      return { data: { user: null }, error: new Error("Invalid token") };
    });

    findUserIdByTokenHashMock.mockResolvedValue(null);
    listForUserMock.mockResolvedValue([]);
    createForUserMock.mockResolvedValue({
      id: "token-uuid-1",
      name: "Claude MCP",
      keyPreview: "kr_test...abcd",
      createdAt: CREATED_AT,
      updatedAt: CREATED_AT,
    });
    deleteForUserMock.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    await Promise.all(apps.splice(0).map((app) => app.close()));
  });

  it("lists API keys for the authenticated user", async () => {
    process.env["SUPABASE_URL"] ??= "https://example.supabase.co";
    process.env["SUPABASE_SERVICE_ROLE_KEY"] ??= "test-service-role-key";

    listForUserMock.mockResolvedValue([
      {
        id: "token-uuid-1",
        name: "default",
        keyPreview: "kr_test...abcd",
        createdAt: CREATED_AT,
        updatedAt: CREATED_AT,
      },
    ]);

    const { buildApp } = await import("../buildApp.js");
    const app = await buildApp();
    apps.push(app);

    const response = await app.inject({
      method: "GET",
      url: "/api/v1/auth/api-keys",
      headers: { authorization: "Bearer valid-token" },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as unknown[];
    expect(body).toHaveLength(1);
    expect(listForUserMock).toHaveBeenCalledWith("auth-user-123");
  });

  it("creates a named API key for the authenticated user", async () => {
    process.env["SUPABASE_URL"] ??= "https://example.supabase.co";
    process.env["SUPABASE_SERVICE_ROLE_KEY"] ??= "test-service-role-key";

    const { buildApp } = await import("../buildApp.js");
    const app = await buildApp();
    apps.push(app);

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/auth/api-keys",
      headers: { authorization: "Bearer valid-token" },
      body: { name: "Claude MCP" },
    });

    expect(response.statusCode).toBe(201);

    const body = response.json() as {
      apiKey: string;
      name: string;
      keyPreview: string;
    };

    expect(body.apiKey).toMatch(/^kr_/);
    expect(body.name).toBe("Claude MCP");
    expect(body.keyPreview).toBe("kr_test...abcd");
    expect(createForUserMock).toHaveBeenCalledTimes(1);
    expect(createForUserMock.mock.calls[0]?.[0]).toBe("auth-user-123");
    expect(createForUserMock.mock.calls[0]?.[1]).toBe("Claude MCP");
    expect(createForUserMock.mock.calls[0]?.[2]).toMatch(/^[a-f0-9]{64}$/);
  });

  it("rejects creation when name is missing", async () => {
    process.env["SUPABASE_URL"] ??= "https://example.supabase.co";
    process.env["SUPABASE_SERVICE_ROLE_KEY"] ??= "test-service-role-key";

    const { buildApp } = await import("../buildApp.js");
    const app = await buildApp();
    apps.push(app);

    const response = await app.inject({
      method: "POST",
      url: "/api/v1/auth/api-keys",
      headers: { authorization: "Bearer valid-token" },
      body: { name: "  " },
    });

    expect(response.statusCode).toBe(400);
  });

  it("deletes an API key for the authenticated user", async () => {
    process.env["SUPABASE_URL"] ??= "https://example.supabase.co";
    process.env["SUPABASE_SERVICE_ROLE_KEY"] ??= "test-service-role-key";

    const { buildApp } = await import("../buildApp.js");
    const app = await buildApp();
    apps.push(app);

    const response = await app.inject({
      method: "DELETE",
      url: "/api/v1/auth/api-keys/token-uuid-1",
      headers: { authorization: "Bearer valid-token" },
    });

    expect(response.statusCode).toBe(204);
    expect(deleteForUserMock).toHaveBeenCalledWith("auth-user-123", "token-uuid-1");
  });
});
