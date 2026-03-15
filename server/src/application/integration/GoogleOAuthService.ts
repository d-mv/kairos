import { randomUUID } from "node:crypto";
import { TokenCipher } from "../../infrastructure/security/tokenCipher.js";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/drive",
];

type GoogleOAuthConfig = {
  clientId: string;
  clientSecret: string;
  clientUrl: string;
  serverUrl: string;
};

export type GoogleConnectionPayload = {
  userId: string;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date | null;
  scopes: string[];
};

export class GoogleOAuthService {
  constructor(
    private readonly cipher: TokenCipher,
    private readonly config: GoogleOAuthConfig,
  ) {}

  getAuthorizationUrl(userId: string): string {
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

  async exchangeCodeForConnection(code: string, state: string): Promise<GoogleConnectionPayload> {
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

    const body = (await res.json()) as {
      access_token?: string;
      expires_in?: number;
      refresh_token?: string;
      scope?: string;
    };

    if (!body.access_token) throw new Error("Google token exchange did not return an access token");

    return {
      userId: parsedState.userId,
      accessToken: body.access_token,
      refreshToken: body.refresh_token ?? null,
      expiresAt: body.expires_in ? new Date(Date.now() + body.expires_in * 1000) : null,
      scopes: body.scope?.split(" ").filter(Boolean) ?? GOOGLE_SCOPES,
    };
  }

  getClientRedirectUrl(status: "success" | "error", provider = "google", error?: string): string {
    const url = new URL("/inbox", this.config.clientUrl);
    url.searchParams.set("dialog", "settings");
    url.searchParams.set("tab", "integrations");
    url.searchParams.set("provider", provider);
    url.searchParams.set("status", status);
    if (error) url.searchParams.set("error", error);
    return url.toString();
  }

  private getRedirectUri(): string {
    return new URL("/api/v1/integrations/google/callback", this.config.serverUrl).toString();
  }

  private createSignedState(payload: { userId: string; nonce: string; issuedAt: number }): string {
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = this.cipher.sign(encodedPayload);
    return `${encodedPayload}.${signature}`;
  }

  private parseSignedState(state: string): { userId: string; nonce: string; issuedAt: number } {
    const [encodedPayload, signature] = state.split(".");
    if (!encodedPayload || !signature || !this.cipher.verify(encodedPayload, signature)) {
      throw new Error("Invalid Google OAuth state");
    }

    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as {
      userId?: string;
      nonce?: string;
      issuedAt?: number;
    };

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
