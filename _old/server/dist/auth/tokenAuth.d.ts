type ApiKeyLookup = {
    findUserIdByTokenHash(tokenHash: string): Promise<string | null>;
};
export declare function resolveUserIdFromJwt(token: string, secret: string): string | null;
export declare function resolveUserIdFromToken(token: string, jwtSecret: string, supabaseUrl: string, apiKeyLookup: ApiKeyLookup): Promise<string | null>;
export {};
//# sourceMappingURL=tokenAuth.d.ts.map