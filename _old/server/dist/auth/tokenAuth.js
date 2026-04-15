import { createHmac, timingSafeEqual } from "node:crypto";
import { createRemoteJWKSet, decodeProtectedHeader, jwtVerify } from "jose";
import { hashApiKey } from "./apiKeys.js";
function decodeBase64UrlJson(value) {
    try {
        return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    }
    catch {
        return null;
    }
}
const jwksCache = new Map();
function verifyHs256Jwt(token, secret) {
    const parts = token.split(".");
    if (parts.length !== 3)
        return null;
    const [headerRaw, payloadRaw, signatureRaw] = parts;
    if (!headerRaw || !payloadRaw || !signatureRaw)
        return null;
    const header = decodeBase64UrlJson(headerRaw);
    if (!header || header.alg !== "HS256")
        return null;
    const expectedSignature = createHmac("sha256", secret)
        .update(`${headerRaw}.${payloadRaw}`)
        .digest("base64url");
    const expected = Buffer.from(expectedSignature);
    const actual = Buffer.from(signatureRaw);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual))
        return null;
    const payload = decodeBase64UrlJson(payloadRaw);
    if (!payload)
        return null;
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.nbf === "number" && payload.nbf > now)
        return null;
    if (typeof payload.exp === "number" && payload.exp <= now)
        return null;
    return payload;
}
export function resolveUserIdFromJwt(token, secret) {
    const payload = verifyHs256Jwt(token, secret);
    return typeof payload?.sub === "string" ? payload.sub : null;
}
async function resolveUserIdFromAsymmetricJwt(token, supabaseUrl) {
    const issuer = `${supabaseUrl.replace(/\/+$/, "")}/auth/v1`;
    const jwksUrl = `${issuer}/.well-known/jwks.json`;
    const jwks = jwksCache.get(jwksUrl) ?? createRemoteJWKSet(new URL(jwksUrl));
    jwksCache.set(jwksUrl, jwks);
    try {
        const { payload } = await jwtVerify(token, jwks, { issuer });
        return typeof payload.sub === "string" ? payload.sub : null;
    }
    catch {
        return null;
    }
}
export async function resolveUserIdFromToken(token, jwtSecret, supabaseUrl, apiKeyLookup) {
    let alg;
    try {
        alg = decodeProtectedHeader(token).alg;
    }
    catch {
        alg = undefined;
    }
    const jwtUserId = alg === "HS256"
        ? resolveUserIdFromJwt(token, jwtSecret)
        : alg
            ? await resolveUserIdFromAsymmetricJwt(token, supabaseUrl)
            : null;
    if (jwtUserId)
        return jwtUserId;
    return apiKeyLookup.findUserIdByTokenHash(hashApiKey(token));
}
//# sourceMappingURL=tokenAuth.js.map