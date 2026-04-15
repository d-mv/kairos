import assert from "node:assert/strict";
import test from "node:test";
import { loadWorkspaceCache, saveWorkspaceCache } from "./cache.js";

test("saveWorkspaceCache persists shell data without tasks", () => {
  const storage = new Map<string, string>();

  globalThis.localStorage = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storage.set(key, value);
    },
  } as Storage;

  saveWorkspaceCache({
    areas: [{ id: "area-1", name: "Area", userId: "user-1", createdAt: "", updatedAt: "" }],
    brainFolders: [],
    brainPages: [],
    projects: [
      {
        id: "project-1",
        name: "Project",
        areaId: null,
        userId: "user-1",
        createdAt: "",
        updatedAt: "",
        completedAt: null,
      },
    ],
  });

  assert.deepEqual(JSON.parse(storage.get("kairos:workspace") ?? "{}"), {
    areas: [{ id: "area-1", name: "Area", userId: "user-1", createdAt: "", updatedAt: "" }],
    brainFolders: [],
    brainPages: [],
    projects: [
      {
        id: "project-1",
        name: "Project",
        areaId: null,
        userId: "user-1",
        createdAt: "",
        updatedAt: "",
        completedAt: null,
      },
    ],
  });
});

test("loadWorkspaceCache ignores legacy cached tasks payloads", () => {
  globalThis.localStorage = {
    getItem: () =>
      JSON.stringify({
        areas: [],
        brainFolders: [],
        brainPages: [],
        projects: [],
        tasks: [{ id: "task-1" }],
      }),
    setItem: () => {},
  } as Storage;

  assert.deepEqual(loadWorkspaceCache(), {
    areas: [],
    brainFolders: [],
    brainPages: [],
    projects: [],
  });
});
