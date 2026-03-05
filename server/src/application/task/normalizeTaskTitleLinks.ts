const BARE_URL_PATTERN = /https?:\/\/[^\s)]+/g;
const MARKDOWN_LINK_PATTERN = /\[[^\]]+\]\((https?:\/\/[^\s)]+)\)/g;
const TITLE_PATTERN = /<title[^>]*>([\s\S]*?)<\/title>/i;
const TRAILING_PUNCTUATION_PATTERN = /[.,!?;:]$/;

type FetchResponseLike = {
  text(): Promise<string>;
};

type FetchLike = (input: string, init?: RequestInit) => Promise<FetchResponseLike>;

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
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

async function resolveUrlLabel(url: string, fetchLike: FetchLike): Promise<string> {
  try {
    const parsedUrl = new URL(url);
    const response = await fetchLike(parsedUrl.toString(), {
      signal: AbortSignal.timeout(4000),
      redirect: "follow",
    });
    const html = await response.text();
    const titleMatch = html.match(TITLE_PATTERN)?.[1]?.trim();
    if (titleMatch) {
      return decodeHtmlEntities(titleMatch).replace(/\s+/g, " ").trim();
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
