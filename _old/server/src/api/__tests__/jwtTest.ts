import { createHmac } from "node:crypto";

function base64UrlEncodeJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

export function createSignedJwt(
  payload: Record<string, unknown>,
  secret = "test-jwt-secret",
): string {
  const encodedHeader = base64UrlEncodeJson({ alg: "HS256", typ: "JWT" });
  const encodedPayload = base64UrlEncodeJson(payload);
  const signature = createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64url");

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}
