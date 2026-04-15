import { createHash, randomBytes } from "node:crypto";
export function generateApiKey() {
    return `kr_${randomBytes(24).toString("hex")}`;
}
export function hashApiKey(apiKey) {
    return createHash("sha256").update(apiKey).digest("hex");
}
export function previewApiKey(apiKey) {
    return `${apiKey.slice(0, 7)}...${apiKey.slice(-4)}`;
}
//# sourceMappingURL=apiKeys.js.map