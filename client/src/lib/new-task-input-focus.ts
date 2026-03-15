export function shouldRestoreNewTaskInputFocus({
  wasLoading,
  loading,
  pendingRestore,
}: {
  wasLoading: boolean;
  loading: boolean;
  pendingRestore: boolean;
}) {
  return wasLoading && !loading && pendingRestore;
}
