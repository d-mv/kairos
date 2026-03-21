import assert from "node:assert/strict";
import test from "node:test";
import { getProjectPageViewMenuItems } from "./project-page-menu.js";

test("getProjectPageViewMenuItems returns no view items when list is the only available view", () => {
  const items = getProjectPageViewMenuItems(
    false,
    "list",
    () => {},
    () => {},
  );

  assert.deepEqual(items, []);
});

test("getProjectPageViewMenuItems returns list and gantt when gantt is available", () => {
  const items = getProjectPageViewMenuItems(
    true,
    "gantt",
    () => {},
    () => {},
  );

  assert.deepEqual(
    items.map((item) => ({
      label: item.label,
      section: item.section,
      shortcut: item.shortcut,
      selected: item.selected,
    })),
    [
      { label: "List", section: "View", shortcut: "L", selected: false },
      { label: "Gantt", section: "View", shortcut: "G", selected: true },
    ],
  );
});
