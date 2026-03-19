const BARE_URL_PATTERN = /https?:\/\/[^\s)]+/g;
const MARKDOWN_LINK_PATTERN = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
const TITLE_PATTERN = /<title[^>]*>([\s\S]*?)<\/title>/gi;
const OG_TITLE_PATTERN =
  /<meta[^>]+(?:property=["']og:title["'][^>]+content|content[^>]+property=["']og:title["'])=["']([^"']+)["'][^>]*>/i;
const META_DESCRIPTION_PATTERN =
  /<meta[^>]+(?:name=["']description["'][^>]+content|content[^>]+name=["']description["'])=["']([^"']+)["'][^>]*>/i;
const OG_DESCRIPTION_PATTERN =
  /<meta[^>]+(?:property=["']og:description["'][^>]+content|content[^>]+property=["']og:description["'])=["']([^"']+)["'][^>]*>/i;
const TWEET_TEXT_PATTERN = /<p[^>]*>([\s\S]*?)<\/p>/i;
const TRAILING_PUNCTUATION_PATTERN = /[.,!?;:]$/;
const INSTAGRAM_CAPTION_PATTERNS = [
  /"edge_media_to_caption"\s*:\s*{"edges":\[\{"node":\{"text":"((?:\\.|[^"\\])*)"/i,
  /"caption"\s*:\s*"((?:\\.|[^"\\])*)"/i,
];
const INSTAGRAM_DESCRIPTION_QUOTE_PATTERN = /instagram:\s*["“]([^"”]+)["”]/i;
const TWITTER_DOMAINS = new Set(["x.com", "twitter.com"]);
const INSTAGRAM_DOMAINS = new Set(["instagram.com", "www.instagram.com"]);
const YOUTUBE_DOMAINS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "www.youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);
const INSTAGRAM_STATS_TITLE_PATTERN =
  /^\s*[\d.,\s]+[kKmMbB]?\s+likes?[,;]?\s*[\d.,\s]+[kKmMbB]?\s+comments?(?:\u2026|\.{3})?\s*$/i;

type FetchResponseLike = {
  text(): Promise<string>;
};

type FetchLike = (input: string, init?: RequestInit) => Promise<FetchResponseLike>;

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function escapeMarkdownLabel(value: string): string {
  return value.replace(/[[\]]/g, "\\$&");
}

function getMarkdownLinkRanges(title: string): Array<{ start: number; end: number }> {
  const ranges: Array<{ start: number; end: number }> = [];
  for (const match of title.matchAll(MARKDOWN_LINK_PATTERN)) {
    const start = match.index ?? 0;
    ranges.push({ start, end: start + match[0].length });
  }
  return ranges;
}

function isInRange(index: number, ranges: Array<{ start: number; end: number }>): boolean {
  return ranges.some((range) => index >= range.start && index < range.end);
}

function excerptFromText(raw: string, maxLength = 25): string {
  const text = decodeHtmlEntities(raw).replace(/\s+/g, " ").trim();
  if (!text) return "";
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

function decodeJsonString(value: string): string {
  try {
    return JSON.parse(`"${value}"`) as string;
  } catch {
    return value;
  }
}

function extractInstagramCaption(html: string): string {
  for (const pattern of INSTAGRAM_CAPTION_PATTERNS) {
    const match = html.match(pattern)?.[1];
    if (!match) continue;
    const excerpt = excerptFromText(decodeJsonString(match), 100);
    if (excerpt) return excerpt;
  }

  return "";
}

function extractInstagramCaptionFromDescription(raw: string): string {
  const description = decodeHtmlEntities(raw).replace(/\s+/g, " ").trim();
  const quotedCaption = description.match(INSTAGRAM_DESCRIPTION_QUOTE_PATTERN)?.[1];
  if (!quotedCaption) return "";

  return excerptFromText(quotedCaption, 100);
}

function isInstagramStatsTitle(title: string): boolean {
  return INSTAGRAM_STATS_TITLE_PATTERN.test(title);
}

function normalizeHtmlTitle(raw: string): string {
  return decodeHtmlEntities(raw).replace(/\s+/g, " ").trim();
}

function isMeaningfulYouTubeTitle(title: string): boolean {
  const normalized = title.replace(/^[-:\s]+/, "").trim();
  return normalized.length > 0 && normalized.toLowerCase() !== "youtube";
}

function extractTitleCandidates(html: string): string[] {
  return Array.from(html.matchAll(TITLE_PATTERN))
    .map((match) => normalizeHtmlTitle(match[1] ?? ""))
    .filter((title) => title.length > 0);
}

async function resolveTwitterLabel(url: string, fetchLike: FetchLike): Promise<string | null> {
  try {
    const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}`;
    const response = await fetchLike(oembedUrl, { signal: AbortSignal.timeout(4000) });
    const json = JSON.parse(await response.text()) as { html?: string };
    const pMatch = json.html?.match(TWEET_TEXT_PATTERN)?.[1];
    if (pMatch) {
      const text = pMatch.replace(/<[^>]+>/g, " ");
      const excerpt = excerptFromText(text, 100);
      if (excerpt) return excerpt;
    }
    return null;
  } catch {
    return null;
  }
}

async function resolveYouTubeLabel(url: string, fetchLike: FetchLike): Promise<string | null> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const response = await fetchLike(oembedUrl, { signal: AbortSignal.timeout(4000) });
    const json = JSON.parse(await response.text()) as { title?: string };
    const title = json.title?.trim();
    return title ? decodeHtmlEntities(title) : null;
  } catch {
    return null;
  }
}

async function resolveUrlLabel(url: string, fetchLike: FetchLike): Promise<string> {
  try {
    const parsedUrl = new URL(url);
    if (TWITTER_DOMAINS.has(parsedUrl.hostname)) {
      const label = await resolveTwitterLabel(url, fetchLike);
      if (label) return label;
      return parsedUrl.hostname;
    }
    const response = await fetchLike(parsedUrl.toString(), {
      signal: AbortSignal.timeout(4000),
      redirect: "follow",
    });
    const html = await response.text();
    const ogTitleMatch = html.match(OG_TITLE_PATTERN)?.[1];
    const descriptionMatch =
      html.match(OG_DESCRIPTION_PATTERN)?.[1] ?? html.match(META_DESCRIPTION_PATTERN)?.[1];
    const titleCandidates = extractTitleCandidates(html);

    if (YOUTUBE_DOMAINS.has(parsedUrl.hostname)) {
      const meaningfulTitle = titleCandidates.find(isMeaningfulYouTubeTitle);
      if (meaningfulTitle) return meaningfulTitle;
      if (ogTitleMatch) return normalizeHtmlTitle(ogTitleMatch);
      const oembedTitle = await resolveYouTubeLabel(url, fetchLike);
      if (oembedTitle) return oembedTitle;
    }

    if (INSTAGRAM_DOMAINS.has(parsedUrl.hostname)) {
      const caption = extractInstagramCaption(html);
      if (caption) return caption;

      if (descriptionMatch) {
        const descriptionCaption = extractInstagramCaptionFromDescription(descriptionMatch);
        if (descriptionCaption) return descriptionCaption;

        const excerpt = excerptFromText(descriptionMatch, 100);
        if (excerpt) return excerpt;
      }

      if (ogTitleMatch) {
        const excerpt = excerptFromText(ogTitleMatch, 100);
        if (excerpt && !isInstagramStatsTitle(excerpt)) return excerpt;
      }
    }

    const title = titleCandidates[0];
    if (title) {
      if (INSTAGRAM_DOMAINS.has(parsedUrl.hostname) && /\bInstragram\b/i.test(title)) {
        return title.replace(/\bInstragram\b/gi, "Instagram");
      }
      return title;
    }
    if (descriptionMatch) {
      const excerpt = excerptFromText(descriptionMatch);
      if (excerpt) return excerpt;
    }
    return parsedUrl.hostname;
  } catch {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  }
}

export async function normalizeTaskTitleLinks(
  title: string,
  fetchLike: FetchLike = (input, init) => fetch(input, init),
): Promise<string> {
  const markdownLinkRanges = getMarkdownLinkRanges(title);
  const urlLabelCache = new Map<string, string>();
  const replacements: Array<{ start: number; end: number; value: string }> = [];

  for (const match of title.matchAll(BARE_URL_PATTERN)) {
    const start = match.index ?? 0;
    if (isInRange(start, markdownLinkRanges)) continue;

    const raw = match[0];
    let normalizedUrl = raw;
    let suffix = "";

    while (TRAILING_PUNCTUATION_PATTERN.test(normalizedUrl)) {
      suffix = normalizedUrl.slice(-1) + suffix;
      normalizedUrl = normalizedUrl.slice(0, -1);
    }

    if (!normalizedUrl) continue;

    const cached = urlLabelCache.get(normalizedUrl);
    const label = cached ?? (await resolveUrlLabel(normalizedUrl, fetchLike));
    if (!cached) {
      urlLabelCache.set(normalizedUrl, label);
    }

    replacements.push({
      start,
      end: start + raw.length,
      value: `[${escapeMarkdownLabel(label)}](${normalizedUrl})${suffix}`,
    });
  }

  if (replacements.length === 0) return title;
  replacements.sort((a, b) => a.start - b.start);

  let cursor = 0;
  let output = "";
  for (const replacement of replacements) {
    output += title.slice(cursor, replacement.start);
    output += replacement.value;
    cursor = replacement.end;
  }
  output += title.slice(cursor);

  return output;
}
