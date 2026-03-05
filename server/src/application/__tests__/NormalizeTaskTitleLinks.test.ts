import { describe, it, expect, vi } from "vitest";
import { normalizeTaskTitleLinks } from "../task/normalizeTaskTitleLinks.js";

describe("normalizeTaskTitleLinks", () => {
  it("converts bare url to markdown link using fetched title", async () => {
    const fetchLike = vi.fn(async () => ({
      text: async () => "<html><head><title>Kairos</title></head><body></body></html>",
    }));

    const result = await normalizeTaskTitleLinks("Check https://kairos-web.fly.dev/inbox", fetchLike);

    expect(result).toBe("Check [Kairos](https://kairos-web.fly.dev/inbox)");
  });

  it("falls back to hostname when page title cannot be fetched", async () => {
    const fetchLike = vi.fn(async () => {
      throw new Error("network");
    });

    const result = await normalizeTaskTitleLinks("Go to https://kairos-web.fly.dev/inbox", fetchLike);

    expect(result).toBe("Go to [kairos-web.fly.dev](https://kairos-web.fly.dev/inbox)");
  });

  it("does not rewrite urls already inside markdown links", async () => {
    const fetchLike = vi.fn(async () => ({
      text: async () => "<html><head><title>Kairos</title></head><body></body></html>",
    }));

    const result = await normalizeTaskTitleLinks(
      "Keep [Docs](https://kairos-web.fly.dev/inbox) and add https://kairos-app.fly.dev/mcp",
      fetchLike,
    );

    expect(result).toBe(
      "Keep [Docs](https://kairos-web.fly.dev/inbox) and add [Kairos](https://kairos-app.fly.dev/mcp)",
    );
  });

  it("keeps trailing punctuation outside the markdown link", async () => {
    const fetchLike = vi.fn(async () => ({
      text: async () => "<html><head><title>Kairos</title></head><body></body></html>",
    }));

    const result = await normalizeTaskTitleLinks("Visit https://kairos-web.fly.dev/inbox.", fetchLike);

    expect(result).toBe("Visit [Kairos](https://kairos-web.fly.dev/inbox).");
  });
});
