import type { BrainContent } from "@kairos/shared";
import { createBrainDocument } from "./brain-content.js";

export type BrainDraftEditorMode = "rich" | "json";

type BrainPageSaveDraft = {
  title: string;
  editorMode: BrainDraftEditorMode;
  richHtml: string;
  rawJson: string;
};

type BrainPageDraftState = BrainPageSaveDraft & {
  savedTitle: string;
  savedContentJson: BrainContent;
};

export function getBrainPageSavePayload(
  draft: BrainPageSaveDraft,
):
  | { ok: true; payload: { title: string; contentJson: BrainContent } }
  | { ok: false; error: string } {
  const normalizedTitle = draft.title.trim() || "Untitled";

  if (draft.editorMode === "rich") {
    return {
      ok: true,
      payload: {
        title: normalizedTitle,
        contentJson: createBrainDocument(draft.richHtml),
      },
    };
  }

  try {
    return {
      ok: true,
      payload: {
        title: normalizedTitle,
        contentJson: JSON.parse(draft.rawJson) as BrainContent,
      },
    };
  } catch {
    return {
      ok: false,
      error: "Content must be valid JSON",
    };
  }
}

export function hasBrainPageDraftChanges(state: BrainPageDraftState): boolean {
  const nextPayload = getBrainPageSavePayload(state);
  if (!nextPayload.ok) return false;

  return (
    nextPayload.payload.title !== state.savedTitle ||
    JSON.stringify(nextPayload.payload.contentJson) !== JSON.stringify(state.savedContentJson)
  );
}
