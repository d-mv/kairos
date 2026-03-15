export type BrainEditorShortcut = "bold" | "italic" | "heading-1" | "heading-2" | "save";

type BrainShortcutEvent = {
  altKey?: boolean;
  ctrlKey?: boolean;
  key: string;
  metaKey?: boolean;
};

export function getBrainEditorShortcut(event: BrainShortcutEvent): BrainEditorShortcut | null {
  const hasModifier = Boolean(event.metaKey || event.ctrlKey);
  if (!hasModifier) return null;

  const key = event.key.toLowerCase();

  if (key === "b") return "bold";
  if (key === "i") return "italic";
  if (key === "s") return "save";
  if (event.altKey && key === "1") return "heading-1";
  if (event.altKey && key === "2") return "heading-2";

  return null;
}
