import type { BrainContent } from "@kairos/shared";

export type BrainFormattedTextBlock = {
  type: "formatted_text";
  html: string;
};

export type BrainDocument = {
  type: "doc";
  version: 1;
  blocks: BrainFormattedTextBlock[];
};

const ANCHOR_PATTERN = /<a\b[^>]*>[\s\S]*?<\/a>/gi;
const URL_PATTERN = /https?:\/\/[^\s<]+/g;
const TRAILING_PUNCTUATION = /[.,!?)]$/;

function splitTrailingPunctuation(url: string) {
  let value = url;
  let trailing = "";

  while (TRAILING_PUNCTUATION.test(value)) {
    trailing = value.slice(-1) + trailing;
    value = value.slice(0, -1);
  }

  return { value, trailing };
}

function linkifyTextSegment(segment: string) {
  return segment.replace(URL_PATTERN, (match) => {
    const { value, trailing } = splitTrailingPunctuation(match);
    return `<a href="${value}" target="_blank" rel="noreferrer">${value}</a>${trailing}`;
  });
}

export function linkifyBrainHtml(html: string) {
  if (!html) return html;

  const parts: string[] = [];
  let lastIndex = 0;

  for (const match of html.matchAll(ANCHOR_PATTERN)) {
    const index = match.index ?? 0;
    parts.push(linkifyTextSegment(html.slice(lastIndex, index)));
    parts.push(match[0]);
    lastIndex = index + match[0].length;
  }

  parts.push(linkifyTextSegment(html.slice(lastIndex)));
  return parts.join("");
}

export function createBrainDocument(html = ""): BrainDocument {
  return {
    type: "doc",
    version: 1,
    blocks: [{ type: "formatted_text", html: linkifyBrainHtml(html) }],
  };
}

export function isBrainDocument(content: BrainContent): content is BrainDocument {
  if (!content || typeof content !== "object") return false;

  const value = content as Partial<BrainDocument>;
  return (
    value.type === "doc" &&
    value.version === 1 &&
    Array.isArray(value.blocks) &&
    value.blocks.every(
      (block) => block?.type === "formatted_text" && typeof block.html === "string",
    )
  );
}

export function getBrainDocument(content: BrainContent): BrainDocument {
  if (!isBrainDocument(content)) return createBrainDocument();
  if (content.blocks.length > 0) return content;
  return createBrainDocument();
}

export function getBrainDocumentHtml(content: BrainContent): string {
  return linkifyBrainHtml(getBrainDocument(content).blocks[0]?.html ?? "");
}
