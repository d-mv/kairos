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
            JSON.stringify({ html: `<blockquote><p lang="en">${"tweet ".repeat(30)}</p>&mdash; Someone</blockquote>` }),
        };
      }
      throw new Error("should not fetch x.com directly");
    });

    const result = await normalizeTaskTitleLinks(
      "Check https://x.com/minds_eminent/status/2030299321149923436",
      fetchLike,
    );

    expect(result).toBe(
      "Check [tweet tweet tweet tweet tweet tweet tweet tweet tweet tweet tweet tweet tweet tweet tweet tweet…](https://x.com/minds_eminent/status/2030299321149923436)",
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

  it("corrects the Instragram typo for instagram links", async () => {
    const fetchLike = vi.fn(async () => ({
      text: async () => "<html><head><title>Instragram</title></head><body></body></html>",
    }));

    const result = await normalizeTaskTitleLinks("See https://www.instagram.com/p/example", fetchLike);

    expect(result).toBe("See [Instagram](https://www.instagram.com/p/example)");
  });

  it("prefers instagram description excerpt over page title", async () => {
    const fetchLike = vi.fn(async () => ({
      text: async () =>
        '<html><head><title>Instagram</title><meta property="og:description" content="Here is the message from the post that should be shown instead of the site title" /></head><body></body></html>',
    }));

    const result = await normalizeTaskTitleLinks("See https://www.instagram.com/p/example", fetchLike);

    expect(result).toBe(
      "See [Here is the message from the post that should be shown instead of the site title](https://www.instagram.com/p/example)",
    );
  });

  it("prefers instagram og:title over page title", async () => {
    const fetchLike = vi.fn(async () => ({
      text: async () =>
        '<html><head><title>Instagram</title><meta property="og:title" content="This is the og title caption that should be used for instagram links" /></head><body></body></html>',
    }));

    const result = await normalizeTaskTitleLinks("See https://www.instagram.com/p/example", fetchLike);

    expect(result).toBe(
      "See [This is the og title caption that should be used for instagram links](https://www.instagram.com/p/example)",
    );
  });

  it("uses youtube page title", async () => {
    const fetchLike = vi.fn(async () => ({
      text: async () =>
        "<html><head><title>Example Video Title - YouTube</title><meta property=\"og:title\" content=\"Ignored og title\" /></head><body></body></html>",
    }));

    const result = await normalizeTaskTitleLinks("Watch https://www.youtube.com/watch?v=abc123", fetchLike);

    expect(result).toBe("Watch [Example Video Title - YouTube](https://www.youtube.com/watch?v=abc123)");
  });

  it("extracts instagram caption from embedded script instead of likes and comments", async () => {
    const fetchLike = vi.fn(async () => ({
      text: async () =>
        `<html><head><title>Instagram</title><meta property="og:description" content="12,345 likes, 67 comments - user on Instagram" /></head><body><script type="application/ld+json">{"edge_media_to_caption":{"edges":[{"node":{"text":"${"caption ".repeat(20)}real ending"}}]}}</script></body></html>`,
    }));

    const result = await normalizeTaskTitleLinks(
      "See https://www.instagram.com/reels/DVSElojChTK/",
      fetchLike,
    );

    expect(result).toBe(
      "See [caption caption caption caption caption caption caption caption caption caption caption caption…](https://www.instagram.com/reels/DVSElojChTK/)",
    );
  });

  it("extracts instagram caption from og description after engagement counts", async () => {
    const fetchLike = vi.fn(async () => ({
      text: async () =>
        '<html><head><title>Instagram</title><meta property="og:description" content="12,345 likes, 67 comments - user on Instagram: &quot;This is the caption text that should win over likes and comments&quot;" /></head><body></body></html>',
    }));

    const result = await normalizeTaskTitleLinks(
      "See https://www.instagram.com/reels/DVSElojChTK/",
      fetchLike,
    );

    expect(result).toBe(
      "See [This is the caption text that should win over likes and comments](https://www.instagram.com/reels/DVSElojChTK/)",
    );
  });

  it("leaves existing instagram markdown labels unchanged", async () => {
    const fetchLike = vi.fn(async () => ({
      text: async () =>
        '<html><head><title>Instagram</title><meta property="og:title" content="This is the og title caption that should replace the stale label" /><meta property="og:description" content="73K likes, 822 comments - user on Instagram" /></head><body></body></html>',
    }));

    const result = await normalizeTaskTitleLinks(
      "See [73K likes, 822 comments…](https://www.instagram.com/reels/DVSElojChTK/)",
      fetchLike,
    );

    expect(result).toBe(
      "See [73K likes, 822 comments…](https://www.instagram.com/reels/DVSElojChTK/)",
    );
  });
});
