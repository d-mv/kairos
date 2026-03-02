import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LATEST_PROTOCOL_VERSION } from "@modelcontextprotocol/sdk/types.js";

const getUserMock = vi.fn();
const listProjectsExecuteMock = vi.fn();
const findUserIdByTokenHashMock = vi.fn();

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
  listProjects: {
    execute: listProjectsExecuteMock,
  },
  listTasks: { execute: vi.fn() },
  createTask: { execute: vi.fn() },
  updateTask: { execute: vi.fn() },
  deleteTask: { execute: vi.fn() },
  completeTask: { execute: vi.fn() },
  promoteTask: { execute: vi.fn() },
  createProject: { execute: vi.fn() },
  demoteProject: { execute: vi.fn() },
  createLink: { execute: vi.fn() },
}));

describe("MCP HTTP endpoint", () => {
  const apps: Array<{ close: () => Promise<void> }> = [];

  beforeEach(() => {
    vi.resetModules();
    getUserMock.mockReset();
    listProjectsExecuteMock.mockReset();
    findUserIdByTokenHashMock.mockReset();
    getUserMock.mockImplementation(async (token: string) => {
      if (token === "valid-token") {
        return { data: { user: { id: "auth-user-123" } }, error: null };
      }
      return { data: { user: null }, error: new Error("Invalid token") };
    });
    findUserIdByTokenHashMock.mockResolvedValue(null);
    listProjectsExecuteMock.mockResolvedValue({ isErr: false, value: [] });
  });

  afterEach(async () => {
    await Promise.all(apps.splice(0).map((app) => app.close()));
  });

  it("requires auth for MCP and derives the user from the bearer token", async () => {
    process.env["SUPABASE_URL"] ??= "https://example.supabase.co";
    process.env["SUPABASE_SERVICE_ROLE_KEY"] ??= "test-service-role-key";

    const { buildApp } = await import("../buildApp.js");
    const app = await buildApp();
    apps.push(app);

    const unauthorizedResponse = await app.inject({
      method: "POST",
      url: "/mcp",
      headers: {
        accept: "application/json, text/event-stream",
        "content-type": "application/json",
      },
      payload: {
        jsonrpc: "2.0",
        id: 0,
        method: "initialize",
        params: {
          protocolVersion: LATEST_PROTOCOL_VERSION,
          capabilities: {},
          clientInfo: { name: "kairos-test-client", version: "0.1.0" },
        },
      },
    });

    expect(unauthorizedResponse.statusCode).toBe(401);

    const initializeResponse = await app.inject({
      method: "POST",
      url: "/mcp",
      headers: {
        accept: "application/json, text/event-stream",
        "content-type": "application/json",
        authorization: "Bearer valid-token",
      },
      payload: {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: LATEST_PROTOCOL_VERSION,
          capabilities: {},
          clientInfo: { name: "kairos-test-client", version: "0.1.0" },
        },
      },
    });

    expect(initializeResponse.statusCode).toBe(200);

    const sessionId = initializeResponse.headers["mcp-session-id"];
    expect(sessionId).toBeUndefined();

    const initializeBody = initializeResponse.json() as {
      result: { protocolVersion: string };
    };

    const toolsResponse = await app.inject({
      method: "POST",
      url: "/mcp",
      headers: {
        accept: "application/json, text/event-stream",
        "content-type": "application/json",
        "mcp-protocol-version": initializeBody.result.protocolVersion,
        authorization: "Bearer valid-token",
      },
      payload: {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
        params: {},
      },
    });

    expect(toolsResponse.statusCode).toBe(200);
    const toolsBody = toolsResponse.json() as {
      result: {
        tools: Array<{ name: string; inputSchema?: { properties?: Record<string, unknown> } }>;
      };
    };

    expect(toolsBody.result.tools.some((tool) => tool.name === "list_tasks")).toBe(true);
    expect(toolsBody.result.tools.some((tool) => tool.name === "create_task")).toBe(true);

    const listProjectsTool = toolsBody.result.tools.find((tool) => tool.name === "list_projects");
    expect(listProjectsTool?.inputSchema?.properties ?? {}).not.toHaveProperty("userId");

    const callResponse = await app.inject({
      method: "POST",
      url: "/mcp",
      headers: {
        accept: "application/json, text/event-stream",
        "content-type": "application/json",
        "mcp-protocol-version": initializeBody.result.protocolVersion,
        authorization: "Bearer valid-token",
      },
      payload: {
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: {
          name: "list_projects",
          arguments: {},
        },
      },
    });

    expect(callResponse.statusCode).toBe(200);
    expect(listProjectsExecuteMock).toHaveBeenCalledWith("auth-user-123");
  });

  it("accepts a stored API key bearer token for MCP auth", async () => {
    process.env["SUPABASE_URL"] ??= "https://example.supabase.co";
    process.env["SUPABASE_SERVICE_ROLE_KEY"] ??= "test-service-role-key";

    findUserIdByTokenHashMock.mockResolvedValue("api-key-user-456");

    const { buildApp } = await import("../buildApp.js");
    const app = await buildApp();
    apps.push(app);

    const initializeResponse = await app.inject({
      method: "POST",
      url: "/mcp",
      headers: {
        accept: "application/json, text/event-stream",
        "content-type": "application/json",
        authorization: "Bearer kr_test_api_key",
      },
      payload: {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: LATEST_PROTOCOL_VERSION,
          capabilities: {},
          clientInfo: { name: "kairos-test-client", version: "0.1.0" },
        },
      },
    });

    expect(initializeResponse.statusCode).toBe(200);
    const initializeBody = initializeResponse.json() as {
      result: { protocolVersion: string };
    };

    const callResponse = await app.inject({
      method: "POST",
      url: "/mcp",
      headers: {
        accept: "application/json, text/event-stream",
        "content-type": "application/json",
        "mcp-protocol-version": initializeBody.result.protocolVersion,
        authorization: "Bearer kr_test_api_key",
      },
      payload: {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: "list_projects",
          arguments: {},
        },
      },
    });

    expect(callResponse.statusCode).toBe(200);
    expect(listProjectsExecuteMock).toHaveBeenCalledWith("api-key-user-456");
  });

  it("returns 404 for oauth discovery routes instead of requiring auth", async () => {
    process.env["SUPABASE_URL"] ??= "https://example.supabase.co";
    process.env["SUPABASE_SERVICE_ROLE_KEY"] ??= "test-service-role-key";

    const { buildApp } = await import("../buildApp.js");
    const app = await buildApp();
    apps.push(app);

    const protectedResourceResponse = await app.inject({
      method: "GET",
      url: "/.well-known/oauth-protected-resource/mcp",
    });
    expect(protectedResourceResponse.statusCode).toBe(404);

    const authServerResponse = await app.inject({
      method: "GET",
      url: "/.well-known/oauth-authorization-server",
    });
    expect(authServerResponse.statusCode).toBe(404);

    const pathScopedAuthServerResponse = await app.inject({
      method: "GET",
      url: "/mcp/.well-known/oauth-authorization-server",
    });
    expect(pathScopedAuthServerResponse.statusCode).toBe(404);
  });
});
