import assert from "node:assert/strict";
import test from "node:test";
import { getBrainEditorShortcut } from "./brain-editor.js";

test("getBrainEditorShortcut returns save for mod+s", () => {
  assert.equal(getBrainEditorShortcut({ key: "s", metaKey: true }), "save");
  assert.equal(getBrainEditorShortcut({ key: "s", ctrlKey: true }), "save");
});

test("getBrainEditorShortcut returns inline formatting shortcuts", () => {
  assert.equal(getBrainEditorShortcut({ key: "b", metaKey: true }), "bold");
  assert.equal(getBrainEditorShortcut({ key: "i", ctrlKey: true }), "italic");
});

test("getBrainEditorShortcut returns heading shortcuts", () => {
  assert.equal(getBrainEditorShortcut({ key: "1", metaKey: true, altKey: true }), "heading-1");
  assert.equal(getBrainEditorShortcut({ key: "2", ctrlKey: true, altKey: true }), "heading-2");
});

test("getBrainEditorShortcut ignores unrelated keyboard input", () => {
  assert.equal(getBrainEditorShortcut({ key: "x", metaKey: true }), null);
  assert.equal(getBrainEditorShortcut({ key: "s" }), null);
});
