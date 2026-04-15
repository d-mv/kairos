import { createHmac, timingSafeEqual } from "node:crypto";
import { createRemoteJWKSet, decodeProtectedHeader, jwtVerify } from "jose";
import { hashApiKey } from "./apiKeys.js";

type ApiKeyLookup = {
  findUserIdByTokenHash(tokenHash: string): Promise<string | null>;
};

type JwtPayload = {
  sub?: unknown;
  exp?: unknown;
  nbf?: unknown;
};

function decodeBase64UrlJson<T>(value: string): T | null {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function verifyHs256Jwt(token: string, secret: string): JwtPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [headerRaw, payloadRaw, signatureRaw] = parts;
  if (!headerRaw || !payloadRaw || !signatureRaw) return null;

  const header = decodeBase64UrlJson<{ alg?: unknown; typ?: unknown }>(headerRaw);
  if (!header || header.alg !== "HS256") return null;

  const expectedSignature = createHmac("sha256", secret)
    .update(`${headerRaw}.${payloadRaw}`)
    .digest("base64url");

  const expected = Buffer.from(expectedSignature);
  const actual = Buffer.from(signatureRaw);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  const payload = decodeBase64UrlJson<JwtPayload>(payloadRaw);
  if (!payload) return null;

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.nbf === "number" && payload.nbf > now) return null;
  if (typeof payload.exp === "number" && payload.exp <= now) return null;

  return payload;
}

export function resolveUserIdFromJwt(token: string, secret: string): string | null {
  const payload = verifyHs256Jwt(token, secret);
  return typeof payload?.sub === "string" ? payload.sub : null;
}

async function resolveUserIdFromAsymmetricJwt(
  token: string,
  supabaseUrl: string,
): Promise<string | null> {
  const issuer = `${supabaseUrl.replace(/\/+$/, "")}/auth/v1`;
  const jwksUrl = `${issuer}/.well-known/jwks.json`;
  const jwks = jwksCache.get(jwksUrl) ?? createRemoteJWKSet(new URL(jwksUrl));
  jwksCache.set(jwksUrl, jwks);

  try {
    const { payload } = await jwtVerify(token, jwks, { issuer });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export async function resolveUserIdFromToken(
  token: string,
  jwtSecret: string,
  supabaseUrl: string,
  apiKeyLookup: ApiKeyLookup,
): Promise<string | null> {
  let alg: string | undefined;
  try {
    alg = decodeProtectedHeader(token).alg;
  } catch {
    alg = undefined;
  }
  const jwtUserId =
    alg === "HS256"
      ? resolveUserIdFromJwt(token, jwtSecret)
      : alg
        ? await resolveUserIdFromAsymmetricJwt(token, supabaseUrl)
        : null;
  if (jwtUserId) return jwtUserId;
  return apiKeyLookup.findUserIdByTokenHash(hashApiKey(token));
}
