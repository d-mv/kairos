const SAVED_SEARCHES_STORAGE_KEY = "kairos.savedSearches";

export function normalizeSavedSearchQuery(query: string): string | null {
  const normalized = query.trim();
  return normalized ? normalized : null;
}

export function addSavedSearch(existing: string[], query: string): string[] {
  const normalized = normalizeSavedSearchQuery(query);
  if (!normalized) return existing;
  return [normalized, ...existing.filter((value) => value !== normalized)];
}

export function removeSavedSearch(existing: string[], query: string): string[] {
  return existing.filter((value) => value !== query);
}

export function loadSavedSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SAVED_SEARCHES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is string => typeof value === "string");
  } catch {
    return [];
  }
}

export function saveSavedSearches(queries: string[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SAVED_SEARCHES_STORAGE_KEY, JSON.stringify(queries));
}
