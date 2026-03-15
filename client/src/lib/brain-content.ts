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

export function createBrainDocument(html = ""): BrainDocument {
  return {
    type: "doc",
    version: 1,
    blocks: [{ type: "formatted_text", html }],
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
  return getBrainDocument(content).blocks[0]?.html ?? "";
}
