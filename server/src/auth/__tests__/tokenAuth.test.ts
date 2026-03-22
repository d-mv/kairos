import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { exportJWK, generateKeyPair, SignJWT } from "jose";
import { resolveUserIdFromToken } from "../tokenAuth.js";

const findUserIdByTokenHashMock = vi.fn();

describe("resolveUserIdFromToken", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    findUserIdByTokenHashMock.mockReset();
    findUserIdByTokenHashMock.mockResolvedValue(null);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("accepts an asymmetric Supabase-style JWT via JWKS", async () => {
    const { privateKey, publicKey } = await generateKeyPair("ES256");
    const jwk = await exportJWK(publicKey);
    jwk.kid = "test-key-id";
    jwk.alg = "ES256";
    jwk.use = "sig";

    global.fetch = vi.fn(async (input) => {
      expect(String(input)).toBe("https://example.supabase.co/auth/v1/.well-known/jwks.json");
      return new Response(JSON.stringify({ keys: [jwk] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as typeof fetch;

    const token = await new SignJWT({})
      .setProtectedHeader({ alg: "ES256", kid: "test-key-id", typ: "JWT" })
      .setSubject("auth-user-123")
      .setExpirationTime("1h")
      .setIssuer("https://example.supabase.co/auth/v1")
      .setAudience("authenticated")
      .sign(privateKey);

    await expect(
      resolveUserIdFromToken(token, "test-jwt-secret", "https://example.supabase.co", {
        findUserIdByTokenHash: findUserIdByTokenHashMock,
      }),
    ).resolves.toBe("auth-user-123");
  });
});
