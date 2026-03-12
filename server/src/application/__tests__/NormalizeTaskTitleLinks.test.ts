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

  it("uses twitter oembed to extract tweet text for x.com links", async () => {
    const fetchLike = vi.fn(async (url: string) => {
      if (url.startsWith("https://publish.twitter.com/oembed")) {
        return {
          text: async () =>
            JSON.stringify({
              html: '<blockquote><p lang="en">This is the actual tweet text that is quite long</p>&mdash; Someone</blockquote>',
            }),
        };
      }
      throw new Error("should not fetch x.com directly");
    });

    const result = await normalizeTaskTitleLinks(
      "Check https://x.com/minds_eminent/status/2030299321149923436",
      fetchLike,
    );

    // "This is the actual tweet text..." → slice(0,25)="This is the actual tweet " → lastSpace at 24 → "This is the actual tweet"
    expect(result).toBe(
      "Check [This is the actual tweet…](https://x.com/minds_eminent/status/2030299321149923436)",
    );
  });

  it("falls back to og:description excerpt when title is missing", async () => {
    const fetchLike = vi.fn(async () => ({
      text: async () =>
        '<html><head><meta property="og:description" content="  This is a tweet about something interesting and long  " /></head><body></body></html>',
    }));

    const result = await normalizeTaskTitleLinks("Read https://example.com/some-page", fetchLike);

    // "This is a tweet about something..." → slice(0,25)="This is a tweet about som" → lastSpace at 21 → "This is a tweet about"
    expect(result).toBe("Read [This is a tweet about…](https://example.com/some-page)");
  });

  it("falls back to meta description excerpt when title and og:description are missing", async () => {
    const fetchLike = vi.fn(async () => ({
      text: async () =>
        '<html><head><meta name="description" content="Short desc" /></head><body></body></html>',
    }));

    const result = await normalizeTaskTitleLinks("Read https://example.com/some-page", fetchLike);

    expect(result).toBe("Read [Short desc](https://example.com/some-page)");
  });

  it("keeps trailing punctuation outside the markdown link", async () => {
    const fetchLike = vi.fn(async () => ({
      text: async () => "<html><head><title>Kairos</title></head><body></body></html>",
    }));

    const result = await normalizeTaskTitleLinks("Visit https://kairos-web.fly.dev/inbox.", fetchLike);

    expect(result).toBe("Visit [Kairos](https://kairos-web.fly.dev/inbox).");
  });
});
