export const SIDEBAR_AREAS_OPEN_STORAGE_KEY = "kairos-sidebar-areas-open";

export function parseSidebarOpenState(value: string | null): Record<string, boolean> {
  if (!value) return {};

  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== "object") return {};

    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, boolean] => typeof entry[1] === "boolean",
      ),
    );
  } catch {
    return {};
  }
}

export function serializeSidebarOpenState(state: Record<string, boolean>) {
  return JSON.stringify(state);
}

export function loadSidebarOpenState() {
  return parseSidebarOpenState(localStorage.getItem(SIDEBAR_AREAS_OPEN_STORAGE_KEY));
}

export function saveSidebarOpenState(state: Record<string, boolean>) {
  localStorage.setItem(SIDEBAR_AREAS_OPEN_STORAGE_KEY, serializeSidebarOpenState(state));
}
