import { useState } from "react";
import { Button, type ButtonProps } from "./ui/button.js";
import { PencilIcon } from "./ui/icons.js";
import { Input } from "./ui/input.js";
import { Label } from "./ui/label.js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog.js";

interface RenameEntityButtonProps {
  className?: string;
  currentName: string;
  entityLabel: string;
  loading?: boolean;
  onRename: (name: string) => Promise<void>;
  iconOnly?: boolean;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
}

export function RenameEntityButton({
  className,
  currentName,
  entityLabel,
  loading = false,
  iconOnly = false,
  onRename,
  size = "sm",
  variant = "outline",
}: RenameEntityButtonProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentName);
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        onClick={() => {
          setName(currentName);
          setError(null);
          setOpen(true);
        }}
        aria-label={`Edit ${entityLabel.toLowerCase()}`}
      >
        <PencilIcon size={14} />
        {iconOnly ? <span className="sr-only">Edit</span> : <span>Edit</span>}
      </Button>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (loading) return;
          setOpen(nextOpen);
          if (!nextOpen) setError(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename {entityLabel}</DialogTitle>
            <DialogDescription>Update the name shown across the workspace.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 px-4 py-4">
            <Label>{entityLabel} name</Label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const trimmed = name.trim();
                  if (!trimmed) {
                    setError(`${entityLabel} name is required`);
                    return;
                  }
                  void onRename(trimmed).then(
                    () => setOpen(false),
                    (err: unknown) =>
                      setError(
                        err instanceof Error
                          ? err.message
                          : `Failed to rename ${entityLabel.toLowerCase()}`,
                      ),
                  );
                }
              }}
              disabled={loading}
              autoFocus
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={loading}
                onClick={() => {
                  if (loading) return;
                  setOpen(false);
                  setError(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={loading}
                onClick={() => {
                  const trimmed = name.trim();
                  if (!trimmed) {
                    setError(`${entityLabel} name is required`);
                    return;
                  }
                  void onRename(trimmed).then(
                    () => setOpen(false),
                    (err: unknown) =>
                      setError(
                        err instanceof Error
                          ? err.message
                          : `Failed to rename ${entityLabel.toLowerCase()}`,
                      ),
                  );
                }}
              >
                {loading ? "Saving..." : "Save"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
