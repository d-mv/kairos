import * as Sentry from "@sentry/react";

type SentryEnv = Record<string, string | undefined>;

export type SentryConfig = {
  dsn: string;
  environment?: string;
  release?: string;
  tracesSampleRate?: number;
};

const normalizeString = (value: string | undefined): string | undefined => {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
};

export const getSentryConfig = (env: SentryEnv): SentryConfig | null => {
  const dsn = normalizeString(env["VITE_SENTRY_DSN"]);

  if (!dsn) {
    return null;
  }

  const config: SentryConfig = { dsn };
  const environment = normalizeString(env["VITE_SENTRY_ENVIRONMENT"]);
  const release = normalizeString(env["VITE_SENTRY_RELEASE"]);
  const tracesSampleRateRaw = normalizeString(env["VITE_SENTRY_TRACES_SAMPLE_RATE"]);

  if (environment) {
    config.environment = environment;
  }

  if (release) {
    config.release = release;
  }

  if (tracesSampleRateRaw) {
    const tracesSampleRate = Number(tracesSampleRateRaw);

    if (Number.isFinite(tracesSampleRate) && tracesSampleRate >= 0 && tracesSampleRate <= 1) {
      config.tracesSampleRate = tracesSampleRate;
    }
  }

  return config;
};

export const initSentry = (
  env: SentryEnv = (import.meta as ImportMeta & { env?: SentryEnv }).env ?? {},
): boolean => {
  const config = getSentryConfig(env);

  if (!config) {
    return false;
  }

  Sentry.init({
    ...config,
    integrations: [Sentry.browserTracingIntegration()],
  });

  return true;
};
