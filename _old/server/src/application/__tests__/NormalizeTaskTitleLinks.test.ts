import { describe, expect, it, vi } from "vitest";
import { normalizeTaskTitleLinks } from "../task/normalizeTaskTitleLinks.js";

describe("normalizeTaskTitleLinks", () => {
  describe("generic URLs", () => {
    it("uses page title for bare urls", async () => {
      const fetchLike = vi.fn(async () => ({
        text: async () => "<html><head><title>Kairos</title></head><body></body></html>",
      }));

      const result = await normalizeTaskTitleLinks(
        "Check https://kairos-web.fly.dev/inbox",
        fetchLike,
      );

      expect(result).toBe("Check [Kairos](https://kairos-web.fly.dev/inbox)");
    });

    it("falls back to hostname when fetch fails", async () => {
      const fetchLike = vi.fn(async () => {
        throw new Error("network");
      });

      const result = await normalizeTaskTitleLinks(
        "Go to https://kairos-web.fly.dev/inbox",
        fetchLike,
      );

      expect(result).toBe("Go to [kairos-web.fly.dev](https://kairos-web.fly.dev/inbox)");
    });

    it("keeps trailing punctuation outside the markdown link", async () => {
      const fetchLike = vi.fn(async () => ({
        text: async () => "<html><head><title>Kairos</title></head><body></body></html>",
      }));

      const result = await normalizeTaskTitleLinks(
        "Visit https://kairos-web.fly.dev/inbox.",
        fetchLike,
      );

      expect(result).toBe("Visit [Kairos](https://kairos-web.fly.dev/inbox).");
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
  });

  describe("x.com", () => {
    it("uses oembed tweet text and truncates to 100 chars", async () => {
      const fetchLike = vi.fn(async (url: string) => {
        if (url.startsWith("https://publish.twitter.com/oembed")) {
          return {
            text: async () =>
              JSON.stringify({
                html: `<blockquote><p lang="en">${"tweet ".repeat(30)}</p>&mdash; Someone</blockquote>`,
              }),
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

    it("falls back to hostname when oembed fails", async () => {
      const fetchLike = vi.fn(async () => {
        throw new Error("network");
      });

      const result = await normalizeTaskTitleLinks(
        "Check https://x.com/example/status/1",
        fetchLike,
      );

      expect(result).toBe("Check [x.com](https://x.com/example/status/1)");
    });
  });

  describe("instagram", () => {
    it("uses og:title first and truncates to 100 chars", async () => {
      const fetchLike = vi.fn(async () => ({
        text: async () =>
          `<html><head><title>Instagram</title><meta property="og:title" content="${"title ".repeat(20)}tail" /></head></html>`,
      }));

      const result = await normalizeTaskTitleLinks(
        "See https://www.instagram.com/p/example",
        fetchLike,
      );

      expect(result).toBe(
        "See [title title title title title title title title title title title title title title title title…](https://www.instagram.com/p/example)",
      );
    });

    it("uses embedded caption data when og:title is missing", async () => {
      const fetchLike = vi.fn(async () => ({
        text: async () =>
          `<html><head><title>Instagram</title></head><body><script type="application/ld+json">{"edge_media_to_caption":{"edges":[{"node":{"text":"${"caption ".repeat(20)}tail"}}]}}</script></body></html>`,
      }));

      const result = await normalizeTaskTitleLinks(
        "See https://www.instagram.com/reels/DVSElojChTK/",
        fetchLike,
      );

      expect(result).toBe(
        "See [caption caption caption caption caption caption caption caption caption caption caption caption…](https://www.instagram.com/reels/DVSElojChTK/)",
      );
    });

    it("uses quoted caption from og:description when needed", async () => {
      const fetchLike = vi.fn(async () => ({
        text: async () =>
          '<html><head><title>Instagram</title><meta property="og:description" content="12,345 likes, 67 comments - user on Instagram: &quot;This is the caption text that should win over likes and comments&quot;" /></head></html>',
      }));

      const result = await normalizeTaskTitleLinks(
        "See https://www.instagram.com/reels/DVSElojChTK/",
        fetchLike,
      );

      expect(result).toBe(
        "See [This is the caption text that should win over likes and comments](https://www.instagram.com/reels/DVSElojChTK/)",
      );
    });

    it("falls back to cleaned title when no better instagram metadata exists", async () => {
      const fetchLike = vi.fn(async () => ({
        text: async () => "<html><head><title>Instragram</title></head></html>",
      }));

      const result = await normalizeTaskTitleLinks(
        "See https://www.instagram.com/p/example",
        fetchLike,
      );

      expect(result).toBe("See [Instagram](https://www.instagram.com/p/example)");
    });

    it("parses stats-author-date-caption og:description into author: caption", async () => {
      const fetchLike = vi.fn(async () => ({
        text: async () =>
          '<html><head><title>Instagram</title><meta property="og:description" content="15K likes, 33 comments - billionaireunions on March 28, 2026: \u201CThese study habits are banned in school\u201D" /></head></html>',
      }));

      const result = await normalizeTaskTitleLinks(
        "See https://www.instagram.com/p/DWb8xcoEkf_/",
        fetchLike,
      );

      expect(result).toBe(
        "See [billionaireunions: These study habits are banned in school](https://www.instagram.com/p/DWb8xcoEkf_/)",
      );
    });

    it("parses stats-author-date-caption og:title into author: caption", async () => {
      const fetchLike = vi.fn(async () => ({
        text: async () =>
          '<html><head><title>Instagram</title><meta property="og:title" content="15K likes, 33 comments - billionaireunions on March 28, 2026: \u201CThese study habits are banned in school\u201D" /></head></html>',
      }));

      const result = await normalizeTaskTitleLinks(
        "See https://www.instagram.com/p/example",
        fetchLike,
      );

      expect(result).toBe(
        "See [billionaireunions: These study habits are banned in school](https://www.instagram.com/p/example)",
      );
    });

    it("leaves existing markdown labels unchanged", async () => {
      const fetchLike = vi.fn(async () => ({
        text: async () =>
          '<html><head><meta property="og:title" content="Should not be used" /></head></html>',
      }));

      const result = await normalizeTaskTitleLinks(
        "See [73K likes, 822 comments…](https://www.instagram.com/reels/DVSElojChTK/)",
        fetchLike,
      );

      expect(result).toBe(
        "See [73K likes, 822 comments…](https://www.instagram.com/reels/DVSElojChTK/)",
      );
    });

    it("ignores likes/comments og:title and prefers description captions", async () => {
      const fetchLike = vi.fn(async () => ({
        text: async () =>
          '<html><head><title>Instagram</title><meta property="og:title" content="73K likes, 822 comments…" /><meta property="og:description" content="user on Instagram: &quot;Follow along as we build the most awesome caption ever posted to this reel.&quot;" /></head></html>',
      }));

      const result = await normalizeTaskTitleLinks(
        "See https://www.instagram.com/reels/DVSElojChTK/",
        fetchLike,
      );

      expect(result).toBe(
        "See [Follow along as we build the most awesome caption ever posted to this reel.](https://www.instagram.com/reels/DVSElojChTK/)",
      );
    });
  });

  describe("youtube", () => {
    it("uses page title for youtube urls", async () => {
      const fetchLike = vi.fn(async () => ({
        text: async () =>
          '<html><head><title>Example Video Title - YouTube</title><meta property="og:title" content="Ignored" /></head></html>',
      }));

      const result = await normalizeTaskTitleLinks(
        "Watch https://www.youtube.com/watch?v=abc123",
        fetchLike,
      );

      expect(result).toBe(
        "Watch [Example Video Title - YouTube](https://www.youtube.com/watch?v=abc123)",
      );
    });

    it("uses page title for other youtube hostnames", async () => {
      const fetchLike = vi.fn(async () => ({
        text: async () => "<html><head><title>Track Title - YouTube Music</title></head></html>",
      }));

      const result = await normalizeTaskTitleLinks(
        "Listen https://music.youtube.com/watch?v=abc123",
        fetchLike,
      );

      expect(result).toBe(
        "Listen [Track Title - YouTube Music](https://music.youtube.com/watch?v=abc123)",
      );
    });

    it("falls back to og:title when youtube title is degenerate", async () => {
      const fetchLike = vi.fn(async () => ({
        text: async () =>
          '<html><head><title> - YouTube</title><meta property="og:title" content="Real Video Title" /></head></html>',
      }));

      const result = await normalizeTaskTitleLinks(
        "Watch https://www.youtube.com/watch?v=abc123",
        fetchLike,
      );

      expect(result).toBe("Watch [Real Video Title](https://www.youtube.com/watch?v=abc123)");
    });

    it("falls back to youtube oembed when html metadata is degenerate", async () => {
      const fetchLike = vi.fn(async (url: string) => {
        if (url.startsWith("https://www.youtube.com/oembed")) {
          return { text: async () => JSON.stringify({ title: "Real Video Title From OEmbed" }) };
        }

        return {
          text: async () => "<html><head><title>- YouTube</title></head></html>",
        };
      });

      const result = await normalizeTaskTitleLinks(
        "Watch https://www.youtube.com/watch?v=abc123",
        fetchLike,
      );

      expect(result).toBe(
        "Watch [Real Video Title From OEmbed](https://www.youtube.com/watch?v=abc123)",
      );
    });

    it("uses a later meaningful youtube title instead of an early placeholder title", async () => {
      const fetchLike = vi.fn(async () => ({
        text: async () =>
          "<html><head><title>- YouTube</title><title>$0.10/Month Runs My Entire AI Life. I&apos;ll Show You How. - YouTube</title></head></html>",
      }));

      const result = await normalizeTaskTitleLinks(
        "Watch https://www.youtube.com/watch?v=abc123",
        fetchLike,
      );

      expect(result).toBe(
        "Watch [$0.10/Month Runs My Entire AI Life. I'll Show You How. - YouTube](https://www.youtube.com/watch?v=abc123)",
      );
    });
  });
});
