import assert from "node:assert/strict";
import test from "node:test";
import { parseSidebarOpenState, serializeSidebarOpenState } from "./sidebar-open-state.js";

test("parseSidebarOpenState returns an empty object for invalid json", () => {
  assert.deepEqual(parseSidebarOpenState("{"), {});
  assert.deepEqual(parseSidebarOpenState(null), {});
});

test("parseSidebarOpenState keeps boolean entries only", () => {
  assert.deepEqual(parseSidebarOpenState('{"area-1":true,"area-2":false,"area-3":"yes"}'), {
    "area-1": true,
    "area-2": false,
  });
});

test("serializeSidebarOpenState keeps the persisted shape stable", () => {
  assert.equal(
    serializeSidebarOpenState({ "area-1": true, "area-2": false }),
    '{"area-1":true,"area-2":false}',
  );
});
