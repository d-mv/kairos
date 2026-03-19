import assert from "node:assert/strict";
import test from "node:test";
import { addSavedSearch, normalizeSavedSearchQuery, removeSavedSearch } from "./saved-searches.js";

test("normalizeSavedSearchQuery trims whitespace and rejects blank values", () => {
  assert.equal(normalizeSavedSearchQuery("  roadmap  "), "roadmap");
  assert.equal(normalizeSavedSearchQuery("   "), null);
});

test("addSavedSearch prepends new searches and de-duplicates existing ones", () => {
  assert.deepEqual(addSavedSearch(["today", "roadmap"], " roadmap "), ["roadmap", "today"]);
  assert.deepEqual(addSavedSearch([], "today"), ["today"]);
});

test("removeSavedSearch removes an exact saved query", () => {
  assert.deepEqual(removeSavedSearch(["today", "roadmap"], "today"), ["roadmap"]);
});
