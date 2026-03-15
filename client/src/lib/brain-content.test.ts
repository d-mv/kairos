import assert from "node:assert/strict";
import test from "node:test";
import {
  createBrainDocument,
  getBrainDocument,
  getBrainDocumentHtml,
  isBrainDocument,
} from "./brain-content.js";

test("createBrainDocument stores formatted text as a single block", () => {
  assert.deepEqual(createBrainDocument("<p>Hello</p>"), {
    type: "doc",
    version: 1,
    blocks: [{ type: "formatted_text", html: "<p>Hello</p>" }],
  });
});

test("getBrainDocument keeps valid document content", () => {
  const content = {
    type: "doc",
    version: 1,
    blocks: [{ type: "formatted_text", html: "<p>Saved</p>" }],
  };

  assert.deepEqual(getBrainDocument(content), content);
});

test("getBrainDocument falls back to an empty document for unsupported content", () => {
  assert.deepEqual(getBrainDocument({ foo: "bar" }), createBrainDocument());
  assert.deepEqual(getBrainDocument(null), createBrainDocument());
});

test("getBrainDocumentHtml returns the first formatted text block", () => {
  assert.equal(
    getBrainDocumentHtml({
      type: "doc",
      version: 1,
      blocks: [
        { type: "formatted_text", html: "<p>First</p>" },
        { type: "formatted_text", html: "<p>Second</p>" },
      ],
    }),
    "<p>First</p>",
  );
});

test("isBrainDocument only returns true for the supported shape", () => {
  assert.equal(isBrainDocument(createBrainDocument()), true);
  assert.equal(isBrainDocument({ type: "doc", blocks: [] }), false);
  assert.equal(isBrainDocument("text"), false);
});
