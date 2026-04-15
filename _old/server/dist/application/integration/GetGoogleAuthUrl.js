export class GetGoogleAuthUrl {
    googleOAuth;
    constructor(googleOAuth) {
        this.googleOAuth = googleOAuth;
    }
    async execute(userId) {
        return this.googleOAuth.getAuthorizationUrl(userId);
    }
}
//# sourceMappingURL=GetGoogleAuthUrl.js.map