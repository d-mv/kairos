import { EntityType } from "@kairos/shared";
import { useAtom } from "jotai";
import { renameEntityAtom } from "../atoms/renameEntity.atom.js";
import { Button } from "./ui/button.js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog.js";
import { Input } from "./ui/input.js";
import { Label } from "./ui/label.js";

type Props = {
  onRename: (name: string, entityId: string, type: EntityType) => Promise<void>;
};

export function RenameEntityDialog({ onRename }: Props) {
  const [renameEntityState, setRenameEntityState] = useAtom(renameEntityAtom);

  if (!renameEntityState) return null;

  const { entityLabel, loading, entityId, currentName, type, errorMessage } = renameEntityState;

  const setError = (v: string | null) => setRenameEntityState((s) => ({ ...s!, errorMessage: v }));
  const setName = (v: string) => setRenameEntityState((s) => ({ ...s!, currentName: v }));
  const cancelDialog = () => setRenameEntityState(null);

  function handleRename() {
    const trimmed = currentName.trim();

    if (!trimmed) {
      setError(`${entityLabel} name is required`);
      return;
    }

    onRename(trimmed, entityId, type).then(cancelDialog, (err: unknown) =>
      setError(
        err instanceof Error ? err.message : `Failed to rename ${entityLabel.toLowerCase()}`,
      ),
    );
  }

  return (
    <Dialog open={true}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename {entityLabel}</DialogTitle>
          <DialogDescription>Update the name shown across the workspace.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 px-4 py-4">
          <Label>{entityLabel} name</Label>
          <Input
            type="text"
            value={currentName}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleRename();
              }
            }}
            disabled={Boolean(loading)}
            autoFocus
          />
          {errorMessage && <p className="text-xs text-destructive">{errorMessage}</p>}
        </div>
        <DialogFooter>
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={Boolean(loading)}
              onClick={() => {
                if (loading) return;
                cancelDialog();
              }}
            >
              Cancel
            </Button>
            <Button type="button" size="sm" disabled={Boolean(loading)} onClick={handleRename}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
