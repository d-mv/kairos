import type { PageMenuItem } from "../atoms/pageMenu.atom.js";

export function findMenuShortcutItem(items: PageMenuItem[], key: string): PageMenuItem | null {
  const normalizedKey = key.trim().toLowerCase();
  if (!normalizedKey) return null;

  return (
    items.find((item) => !item.disabled && item.shortcut?.trim().toLowerCase() === normalizedKey) ??
    null
  );
}
