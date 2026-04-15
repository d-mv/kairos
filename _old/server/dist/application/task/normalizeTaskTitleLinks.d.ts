type FetchResponseLike = {
    text(): Promise<string>;
};
type FetchLike = (input: string, init?: RequestInit) => Promise<FetchResponseLike>;
export declare function normalizeTaskTitleLinks(title: string, fetchLike?: FetchLike): Promise<string>;
export {};
//# sourceMappingURL=normalizeTaskTitleLinks.d.ts.map