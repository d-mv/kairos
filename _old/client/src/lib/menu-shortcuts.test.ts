import assert from "node:assert/strict";
import test from "node:test";
import { findMenuShortcutItem } from "./menu-shortcuts.js";

test("findMenuShortcutItem matches shortcuts case-insensitively", () => {
  const item = findMenuShortcutItem(
    [
      { label: "List", section: "View", shortcut: "L", onClick: () => {} },
      { label: "Schedule", section: "View", shortcut: "S", onClick: () => {} },
    ],
    "s",
  );

  assert.equal(item?.label, "Schedule");
});

test("findMenuShortcutItem ignores disabled and missing shortcuts", () => {
  const item = findMenuShortcutItem(
    [
      {
        label: "List",
        section: "View",
        shortcut: "L",
        disabled: true,
        onClick: () => {},
      },
      { label: "Rename", onClick: () => {} },
    ],
    "l",
  );

  assert.equal(item, null);
});
