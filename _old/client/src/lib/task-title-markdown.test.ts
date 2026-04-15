import assert from "node:assert/strict";
import test from "node:test";
import { tokenizeTaskTitleMarkdown } from "./task-title-markdown.js";

test("tokenizeTaskTitleMarkdown parses bold and italic text", () => {
  const tokens = tokenizeTaskTitleMarkdown("Ship *soon* with **confidence**");

  assert.deepEqual(tokens, [
    { type: "text", value: "Ship " },
    { type: "italic", value: "soon" },
    { type: "text", value: " with " },
    { type: "bold", value: "confidence" },
  ]);
});

test("tokenizeTaskTitleMarkdown parses markdown links", () => {
  const tokens = tokenizeTaskTitleMarkdown("Read [docs](https://example.com/docs)");

  assert.deepEqual(tokens, [
    { type: "text", value: "Read " },
    { type: "link", value: "docs", href: "https://example.com/docs" },
  ]);
});

test("tokenizeTaskTitleMarkdown parses bare URLs", () => {
  const tokens = tokenizeTaskTitleMarkdown("https://kairos-web.fly.dev is live");

  assert.deepEqual(tokens, [
    { type: "link", value: "https://kairos-web.fly.dev", href: "https://kairos-web.fly.dev" },
    { type: "text", value: " is live" },
  ]);
});
