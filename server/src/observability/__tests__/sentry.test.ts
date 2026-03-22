import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const initMock = vi.fn();

vi.mock("@sentry/node", () => ({
  init: initMock,
  captureException: vi.fn(),
  withScope: vi.fn(),
  flush: vi.fn(),
}));

describe("backend sentry init", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    initMock.mockReset();
    process.env = { ...originalEnv };
    delete process.env["SENTRY_DSN"];
    delete process.env["SENTRY_ENVIRONMENT"];
    delete process.env["SENTRY_RELEASE"];
    delete process.env["SENTRY_TRACES_SAMPLE_RATE"];
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("does nothing when SENTRY_DSN is missing", async () => {
    const { initSentry } = await import("../sentry.js");

    expect(initSentry()).toBe(false);
    expect(initMock).not.toHaveBeenCalled();
  });

  it("initializes Sentry from environment variables", async () => {
    process.env["SENTRY_DSN"] = "https://examplePublicKey@o0.ingest.sentry.io/0";
    process.env["SENTRY_ENVIRONMENT"] = "production";
    process.env["SENTRY_RELEASE"] = "kairos@1.2.3";
    process.env["SENTRY_TRACES_SAMPLE_RATE"] = "0.25";

    const { initSentry } = await import("../sentry.js");

    expect(initSentry()).toBe(true);
    expect(initMock).toHaveBeenCalledWith({
      dsn: "https://examplePublicKey@o0.ingest.sentry.io/0",
      enabled: true,
      environment: "production",
      release: "kairos@1.2.3",
      tracesSampleRate: 0.25,
    });
  });
});
