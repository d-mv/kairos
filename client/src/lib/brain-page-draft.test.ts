import assert from "node:assert/strict";
import test from "node:test";
import { createBrainDocument } from "./brain-content.js";
import { getBrainPageSavePayload, hasBrainPageDraftChanges } from "./brain-page-draft.js";

test("hasBrainPageDraftChanges detects title edits", () => {
  assert.equal(
    hasBrainPageDraftChanges({
      savedTitle: "Page",
      savedContentJson: createBrainDocument("<p>Body</p>"),
      title: "Renamed",
      editorMode: "rich",
      richHtml: "<p>Body</p>",
      rawJson: JSON.stringify(createBrainDocument("<p>Body</p>")),
    }),
    true,
  );
});

test("hasBrainPageDraftChanges detects rich text edits", () => {
  assert.equal(
    hasBrainPageDraftChanges({
      savedTitle: "Page",
      savedContentJson: createBrainDocument("<p>Body</p>"),
      title: "Page",
      editorMode: "rich",
      richHtml: "<p>Changed</p>",
      rawJson: JSON.stringify(createBrainDocument("<p>Body</p>")),
    }),
    true,
  );
});

test("hasBrainPageDraftChanges ignores unchanged draft", () => {
  const content = createBrainDocument("<p>Body</p>");

  assert.equal(
    hasBrainPageDraftChanges({
      savedTitle: "Page",
      savedContentJson: content,
      title: "Page",
      editorMode: "rich",
      richHtml: "<p>Body</p>",
      rawJson: JSON.stringify(content),
    }),
    false,
  );
});

test("getBrainPageSavePayload returns rich editor content", () => {
  assert.deepEqual(
    getBrainPageSavePayload({
      title: " Page ",
      editorMode: "rich",
      richHtml: "<p>Hello</p>",
      rawJson: "{}",
    }),
    {
      ok: true,
      payload: {
        title: "Page",
        contentJson: createBrainDocument("<p>Hello</p>"),
      },
    },
  );
});

test("getBrainPageSavePayload validates raw json mode", () => {
  assert.deepEqual(
    getBrainPageSavePayload({
      title: "",
      editorMode: "json",
      richHtml: "",
      rawJson: "{",
    }),
    {
      ok: false,
      error: "Content must be valid JSON",
    },
  );
});
