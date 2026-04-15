import { randomUUID } from "node:crypto";
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_SCOPES = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/drive",
];
export class GoogleOAuthService {
    cipher;
    config;
    constructor(cipher, config) {
        this.cipher = cipher;
        this.config = config;
    }
    getAuthorizationUrl(userId) {
        const state = this.createSignedState({ userId, nonce: randomUUID(), issuedAt: Date.now() });
        const url = new URL(GOOGLE_AUTH_URL);
        url.searchParams.set("client_id", this.config.clientId);
        url.searchParams.set("redirect_uri", this.getRedirectUri());
        url.searchParams.set("response_type", "code");
        url.searchParams.set("access_type", "offline");
        url.searchParams.set("prompt", "consent");
        url.searchParams.set("scope", GOOGLE_SCOPES.join(" "));
        url.searchParams.set("state", state);
        return url.toString();
    }
    async exchangeCodeForConnection(code, state) {
        const parsedState = this.parseSignedState(state);
        const res = await fetch(GOOGLE_TOKEN_URL, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code,
                client_id: this.config.clientId,
                client_secret: this.config.clientSecret,
                redirect_uri: this.getRedirectUri(),
                grant_type: "authorization_code",
            }),
        });
        if (!res.ok) {
            const raw = await res.text();
            throw new Error(raw || "Google token exchange failed");
        }
        const body = (await res.json());
        if (!body.access_token)
            throw new Error("Google token exchange did not return an access token");
        return {
            userId: parsedState.userId,
            accessToken: body.access_token,
            refreshToken: body.refresh_token ?? null,
            expiresAt: body.expires_in ? new Date(Date.now() + body.expires_in * 1000) : null,
            scopes: body.scope?.split(" ").filter(Boolean) ?? GOOGLE_SCOPES,
        };
    }
    getClientRedirectUrl(status, provider = "google", error) {
        const url = new URL("/inbox", this.config.clientUrl);
        url.searchParams.set("dialog", "settings");
        url.searchParams.set("tab", "integrations");
        url.searchParams.set("provider", provider);
        url.searchParams.set("status", status);
        if (error)
            url.searchParams.set("error", error);
        return url.toString();
    }
    getRedirectUri() {
        return new URL("/api/v1/integrations/google/callback", this.config.serverUrl).toString();
    }
    createSignedState(payload) {
        const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
        const signature = this.cipher.sign(encodedPayload);
        return `${encodedPayload}.${signature}`;
    }
    parseSignedState(state) {
        const [encodedPayload, signature] = state.split(".");
        if (!encodedPayload || !signature || !this.cipher.verify(encodedPayload, signature)) {
            throw new Error("Invalid Google OAuth state");
        }
        const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
        if (!payload.userId || !payload.nonce || typeof payload.issuedAt !== "number") {
            throw new Error("Invalid Google OAuth state payload");
        }
        return {
            userId: payload.userId,
            nonce: payload.nonce,
            issuedAt: payload.issuedAt,
        };
    }
}
//# sourceMappingURL=GoogleOAuthService.js.map