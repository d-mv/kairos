import test from "node:test";
import assert from "node:assert/strict";
import { resolveInitialSession } from "./auth-bootstrap.js";

test("resolveInitialSession returns the existing session", async () => {
  const session = { access_token: "token" };

  const result = await resolveInitialSession(async () => ({
    data: { session },
  }));

  assert.deepEqual(result, session);
});

test("resolveInitialSession returns null and reports errors", async () => {
  const error = new Error("boom");
  let reportedError: unknown = null;

  const result = await resolveInitialSession(
    async () => {
      throw error;
    },
    (nextError) => {
      reportedError = nextError;
    },
  );

  assert.equal(result, null);
  assert.equal(reportedError, error);
});
