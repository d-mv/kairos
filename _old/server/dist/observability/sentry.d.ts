type ServerExceptionContext = {
    method?: string;
    url?: string;
    requestId?: string;
    userId?: string;
};
export declare function initSentry(): boolean;
export declare function captureServerException(error: unknown, context?: ServerExceptionContext): void;
export declare function registerSentryProcessHandlers(): void;
export {};
//# sourceMappingURL=sentry.d.ts.map