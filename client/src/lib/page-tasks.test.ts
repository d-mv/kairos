import assert from "node:assert/strict";
import test from "node:test";
import { getPageTaskListParams, getPageTaskScopeKey } from "./page-tasks.js";

test("getPageTaskListParams maps scoped pages to filtered task queries", () => {
  assert.deepEqual(getPageTaskListParams({ kind: "inbox" }), { inbox: true });
  assert.deepEqual(getPageTaskListParams({ kind: "project", id: "project-1" }), {
    projectId: "project-1",
  });
  assert.deepEqual(getPageTaskListParams({ kind: "area", id: "area-1" }), {
    areaId: "area-1",
  });
});

test("getPageTaskListParams leaves workspace-wide pages unfiltered", () => {
  assert.equal(getPageTaskListParams({ kind: "today" }), undefined);
  assert.equal(getPageTaskListParams({ kind: "upcoming" }), undefined);
  assert.equal(getPageTaskListParams({ kind: "schedule" }), undefined);
  assert.equal(getPageTaskListParams({ kind: "projects" }), undefined);
  assert.equal(getPageTaskListParams({ kind: "search" }), undefined);
  assert.equal(getPageTaskListParams({ kind: "completed" }), undefined);
});

test("getPageTaskScopeKey stays stable for equivalent page scopes", () => {
  assert.equal(getPageTaskScopeKey(null), "");
  assert.equal(getPageTaskScopeKey({ kind: "inbox" }), "inbox");
  assert.equal(getPageTaskScopeKey({ kind: "project", id: "project-1" }), "project:project-1");
  assert.equal(getPageTaskScopeKey({ kind: "project", id: "project-1" }), "project:project-1");
  assert.equal(getPageTaskScopeKey({ kind: "area", id: "area-1" }), "area:area-1");
});
