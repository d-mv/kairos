type SupabaseRefreshClient = {
    auth: {
        refreshSession: (input: {
            refresh_token: string;
        }) => Promise<{
            data: {
                session: {
                    user?: {
                        id?: string;
                    };
                } | null;
            };
            error: {
                message: string;
            } | null;
        }>;
    };
};
type ResolveKairosMcpUserIdOptions = {
    authFilePath?: string;
    readFile?: (path: string, encoding: "utf8") => Promise<string>;
    createSupabaseClient?: (url: string, anonKey: string) => SupabaseRefreshClient;
};
export declare function resolveKairosMcpUserId({ authFilePath, readFile: readFileImpl, createSupabaseClient, }?: ResolveKairosMcpUserIdOptions): Promise<string>;
export {};
//# sourceMappingURL=stdioAuth.d.ts.map