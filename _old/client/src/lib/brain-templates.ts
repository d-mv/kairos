import { createBrainDocument } from "./brain-content.js";

export type BrainTemplateType = "blank" | "note" | "bookmark";

export function buildBrainTemplateContent(type: BrainTemplateType, options?: { url?: string }) {
  switch (type) {
    case "blank":
      return createBrainDocument();
    case "note":
      return createBrainDocument("<h1>Notes</h1><p></p>");
    case "bookmark":
      return createBrainDocument(
        `<p><a href="${options?.url ?? ""}" target="_blank" rel="noreferrer">${options?.url ?? ""}</a></p><p></p>`,
      );
  }
}
