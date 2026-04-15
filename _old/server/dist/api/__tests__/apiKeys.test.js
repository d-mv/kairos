import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const getUserMock = vi.fn();
const findUserIdByTokenHashMock = vi.fn();
const rotateForUserMock = vi.fn();
const getForUserMock = vi.fn();
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
        rotateForUser: rotateForUserMock,
        getForUser: getForUserMock,
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
    promoteTask: { execute: vi.fn() },
    createLink: { execute: vi.fn() },
    deleteLink: { execute: vi.fn() },
}));
describe("API key routes", () => {
    const apps = [];
    beforeEach(() => {
        vi.resetModules();
        getUserMock.mockReset();
        findUserIdByTokenHashMock.mockReset();
        rotateForUserMock.mockReset();
        getForUserMock.mockReset();
        getUserMock.mockImplementation(async (token) => {
            if (token === "valid-token") {
                return { data: { user: { id: "auth-user-123" } }, error: null };
            }
            return { data: { user: null }, error: new Error("Invalid token") };
        });
        findUserIdByTokenHashMock.mockResolvedValue(null);
        getForUserMock.mockResolvedValue(null);
        rotateForUserMock.mockResolvedValue({
            keyPreview: "kr_test...abcd",
            createdAt: "2026-03-02T00:00:00.000Z",
            updatedAt: "2026-03-02T00:00:00.000Z",
        });
    });
    afterEach(async () => {
        await Promise.all(apps.splice(0).map((app) => app.close()));
    });
    it("rotates the authenticated user's API key", async () => {
        process.env["SUPABASE_URL"] ??= "https://example.supabase.co";
        process.env["SUPABASE_SERVICE_ROLE_KEY"] ??= "test-service-role-key";
        const { buildApp } = await import("../buildApp.js");
        const app = await buildApp();
        apps.push(app);
        const response = await app.inject({
            method: "POST",
            url: "/api/v1/auth/api-key",
            headers: {
                authorization: "Bearer valid-token",
            },
        });
        expect(response.statusCode).toBe(200);
        const body = response.json();
        expect(body.apiKey).toMatch(/^kr_/);
        expect(body.keyPreview).toBe("kr_test...abcd");
        expect(rotateForUserMock).toHaveBeenCalledTimes(1);
        expect(rotateForUserMock.mock.calls[0]?.[0]).toBe("auth-user-123");
        expect(rotateForUserMock.mock.calls[0]?.[1]).toMatch(/^[a-f0-9]{64}$/);
    });
    it("returns current API key metadata for the authenticated user", async () => {
        process.env["SUPABASE_URL"] ??= "https://example.supabase.co";
        process.env["SUPABASE_SERVICE_ROLE_KEY"] ??= "test-service-role-key";
        getForUserMock.mockResolvedValue({
            keyPreview: "kr_test...abcd",
            createdAt: "2026-03-02T00:00:00.000Z",
            updatedAt: "2026-03-02T00:00:00.000Z",
        });
        const { buildApp } = await import("../buildApp.js");
        const app = await buildApp();
        apps.push(app);
        const response = await app.inject({
            method: "GET",
            url: "/api/v1/auth/api-key",
            headers: {
                authorization: "Bearer valid-token",
            },
        });
        expect(response.statusCode).toBe(200);
        expect(response.json()).toEqual({
            hasKey: true,
            keyPreview: "kr_test...abcd",
            createdAt: "2026-03-02T00:00:00.000Z",
            updatedAt: "2026-03-02T00:00:00.000Z",
        });
    });
});
//# sourceMappingURL=apiKeys.test.js.map