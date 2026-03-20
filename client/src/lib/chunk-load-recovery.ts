const RELOAD_ATTEMPT_KEY = "kairos:chunk-load-recovery-at";
const RELOAD_THROTTLE_MS = 30_000;

type StorageLike = Pick<Storage, "getItem" | "setItem">;
type ReloadLike = () => void;
type PreloadErrorEventLike = Pick<Event, "preventDefault">;

export function recoverFromChunkLoadError(
  event: PreloadErrorEventLike,
  storage: StorageLike,
  reload: ReloadLike,
  now = Date.now(),
): boolean {
  const lastAttemptRaw = storage.getItem(RELOAD_ATTEMPT_KEY);
  const lastAttempt = lastAttemptRaw === null ? null : Number(lastAttemptRaw);
  if (
    lastAttempt !== null &&
    Number.isFinite(lastAttempt) &&
    now - lastAttempt < RELOAD_THROTTLE_MS
  ) {
    return false;
  }

  event.preventDefault();
  storage.setItem(RELOAD_ATTEMPT_KEY, String(now));
  reload();
  return true;
}
