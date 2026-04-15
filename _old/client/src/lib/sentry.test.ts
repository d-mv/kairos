import assert from "node:assert/strict";
import test from "node:test";
import { getSentryConfig } from "./sentry.js";

test("getSentryConfig returns null when DSN is missing", () => {
  assert.equal(getSentryConfig({}), null);
  assert.equal(getSentryConfig({ VITE_SENTRY_DSN: "" }), null);
});

test("getSentryConfig returns normalized config from env vars", () => {
  assert.deepEqual(
    getSentryConfig({
      VITE_SENTRY_DSN: "https://example.ingest.sentry.io/123",
      VITE_SENTRY_ENVIRONMENT: "production",
      VITE_SENTRY_RELEASE: "web@1.2.3",
      VITE_SENTRY_TRACES_SAMPLE_RATE: "0.25",
    }),
    {
      dsn: "https://example.ingest.sentry.io/123",
      environment: "production",
      release: "web@1.2.3",
      tracesSampleRate: 0.25,
    },
  );
});

test("getSentryConfig ignores invalid trace sample rate values", () => {
  assert.deepEqual(
    getSentryConfig({
      VITE_SENTRY_DSN: "https://example.ingest.sentry.io/123",
      VITE_SENTRY_TRACES_SAMPLE_RATE: "wat",
    }),
    {
      dsn: "https://example.ingest.sentry.io/123",
    },
  );
});
