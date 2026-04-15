import { createHash, randomBytes } from "node:crypto";

export function generateApiKey(): string {
  return `kr_${randomBytes(24).toString("hex")}`;
}

export function hashApiKey(apiKey: string): string {
  return createHash("sha256").update(apiKey).digest("hex");
}

export function previewApiKey(apiKey: string): string {
  return `${apiKey.slice(0, 7)}...${apiKey.slice(-4)}`;
}
