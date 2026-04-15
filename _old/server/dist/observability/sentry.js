import * as Sentry from "@sentry/node";
let initialized = false;
let processHandlersRegistered = false;
function parseTracesSampleRate(value) {
    if (!value)
        return undefined;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1)
        return undefined;
    return parsed;
}
export function initSentry() {
    if (initialized)
        return true;
    const dsn = process.env["SENTRY_DSN"]?.trim();
    if (!dsn)
        return false;
    Sentry.init({
        dsn,
        enabled: true,
        environment: process.env["SENTRY_ENVIRONMENT"],
        release: process.env["SENTRY_RELEASE"],
        tracesSampleRate: parseTracesSampleRate(process.env["SENTRY_TRACES_SAMPLE_RATE"]),
    });
    initialized = true;
    registerSentryProcessHandlers();
    return true;
}
export function captureServerException(error, context = {}) {
    if (!initialized)
        return;
    Sentry.withScope((scope) => {
        if (context.requestId)
            scope.setTag("request_id", context.requestId);
        if (context.method || context.url) {
            scope.setContext("request", {
                method: context.method,
                url: context.url,
            });
        }
        if (context.userId) {
            scope.setUser({ id: context.userId });
        }
        Sentry.captureException(error);
    });
}
export function registerSentryProcessHandlers() {
    if (processHandlersRegistered)
        return;
    process.on("unhandledRejection", (reason) => {
        captureServerException(reason, { requestId: "unhandledRejection" });
        void Sentry.flush(2000);
    });
    process.on("uncaughtException", (error) => {
        captureServerException(error, { requestId: "uncaughtException" });
        void Sentry.flush(2000);
    });
    processHandlersRegistered = true;
}
//# sourceMappingURL=sentry.js.map