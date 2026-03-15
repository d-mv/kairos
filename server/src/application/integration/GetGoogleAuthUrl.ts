import { GoogleOAuthService } from "./GoogleOAuthService.js";

export class GetGoogleAuthUrl {
  constructor(private readonly googleOAuth: GoogleOAuthService) {}

  async execute(userId: string): Promise<string> {
    return this.googleOAuth.getAuthorizationUrl(userId);
  }
}
