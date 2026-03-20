import assert from "node:assert/strict";
import test from "node:test";
import { recoverFromChunkLoadError } from "./chunk-load-recovery.js";

test("recoverFromChunkLoadError reloads once when a chunk fails to load", () => {
  let prevented = false;
  let reloaded = false;
  const storage = new Map<string, string>();

  const recovered = recoverFromChunkLoadError(
    {
      preventDefault: () => {
        prevented = true;
      },
    },
    {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => {
        storage.set(key, value);
      },
    },
    () => {
      reloaded = true;
    },
    1_000,
  );

  assert.equal(recovered, true);
  assert.equal(prevented, true);
  assert.equal(reloaded, true);
  assert.equal(storage.get("kairos:chunk-load-recovery-at"), "1000");
});

test("recoverFromChunkLoadError does not reload again within the throttle window", () => {
  let prevented = false;
  let reloads = 0;

  const recovered = recoverFromChunkLoadError(
    {
      preventDefault: () => {
        prevented = true;
      },
    },
    {
      getItem: () => "1000",
      setItem: () => {
        throw new Error("should not write");
      },
    },
    () => {
      reloads += 1;
    },
    2_000,
  );

  assert.equal(recovered, false);
  assert.equal(prevented, false);
  assert.equal(reloads, 0);
});
