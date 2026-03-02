import { describe, expect, it, vi } from "vitest";

import { resolveKairosMcpUserId } from "../stdioAuth.js";

describe("resolveKairosMcpUserId", () => {
  it("derives the user id from a stored refresh token", async () => {
    const refreshSession = vi.fn().mockResolvedValue({
      data: { session: { user: { id: "user-123" } } },
      error: null,
    });

    const userId = await resolveKairosMcpUserId({
      authFilePath: "/tmp/kairos-auth.json",
      readFile: async () =>
        JSON.stringify({
          supabaseUrl: "https://example.supabase.co",
          supabaseAnonKey: "anon-key",
          refreshToken: "refresh-token",
        }),
      createSupabaseClient: () =>
        ({
          auth: {
            refreshSession,
          },
        }) as never,
    });

    expect(userId).toBe("user-123");
    expect(refreshSession).toHaveBeenCalledWith({ refresh_token: "refresh-token" });
  });
});
