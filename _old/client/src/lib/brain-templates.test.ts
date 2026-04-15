import assert from "node:assert/strict";
import test from "node:test";
import { createBrainDocument } from "./brain-content.js";
import { buildBrainTemplateContent } from "./brain-templates.js";

test("buildBrainTemplateContent returns an empty document for blank pages", () => {
  assert.deepEqual(buildBrainTemplateContent("blank"), createBrainDocument());
});

test("buildBrainTemplateContent returns a starter note document", () => {
  assert.deepEqual(buildBrainTemplateContent("note"), createBrainDocument("<h1>Notes</h1><p></p>"));
});

test("buildBrainTemplateContent returns a bookmark document with a link", () => {
  assert.deepEqual(
    buildBrainTemplateContent("bookmark", { url: "https://example.com/docs" }),
    createBrainDocument(
      '<p><a href="https://example.com/docs" target="_blank" rel="noreferrer">https://example.com/docs</a></p><p></p>',
    ),
  );
});
