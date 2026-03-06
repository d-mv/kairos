import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button.js";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog.js";
import { EllipsisVerticalIcon } from "./ui/heroicons.js";
import { Input } from "./ui/input.js";
import { Label } from "./ui/label.js";

type AreaSettingsMenuProps = {
  areaName: string;
  renameLoading: boolean;
  deleteLoading: boolean;
  onRename: (name: string) => Promise<void>;
  onDelete: () => Promise<void>;
};

export function AreaSettingsMenu({
  areaName,
  renameLoading,
  deleteLoading,
  onRename,
  onDelete,
}: AreaSettingsMenuProps) {
  const [open, setOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(areaName);
  const [renameError, setRenameError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setRenameValue(areaName);
  }, [areaName]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <>
      <div className="relative" ref={menuRef}>
        <Button
          type="button"
          variant={open ? "outline" : "ghost"}
          size="icon"
          aria-label="Open area menu"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          <EllipsisVerticalIcon className="h-6 w-6" />
        </Button>

        {open ? (
          <div className="absolute right-0 top-[calc(100%+0.8rem)] z-20 w-[20rem] rounded-[1.2rem] border border-[var(--color-sidebar-border)] bg-background/95 p-2 text-foreground shadow-[var(--shadow-panel)] backdrop-blur-xl">
            <button
              type="button"
              className="flex w-full rounded-[1rem] border-0 px-3 py-3 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={() => {
                setOpen(false);
                setRenameError(null);
                setRenameValue(areaName);
                setRenameOpen(true);
              }}
            >
              Rename
            </button>
            <button
              type="button"
              className="flex w-full rounded-[1rem] border-0 px-3 py-3 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
              onClick={() => {
                setOpen(false);
                void onDelete();
              }}
              disabled={deleteLoading}
            >
              Delete
            </button>
          </div>
        ) : null}
      </div>

      <Dialog
        open={renameOpen}
        onOpenChange={(nextOpen) => {
          if (renameLoading) return;
          setRenameOpen(nextOpen);
          if (!nextOpen) setRenameError(null);
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename Area</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <Label>Area</Label>
            <Input
              type="text"
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                const nextName = renameValue.trim();
                if (!nextName) {
                  setRenameError("Area name is required");
                  return;
                }
                void onRename(nextName).then(
                  () => setRenameOpen(false),
                  (err: unknown) =>
                    setRenameError(err instanceof Error ? err.message : "Failed to rename area"),
                );
              }}
              disabled={renameLoading}
              autoFocus
            />
            {renameError ? <p className="text-xs text-destructive">{renameError}</p> : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={renameLoading}
              onClick={() => {
                if (renameLoading) return;
                setRenameOpen(false);
                setRenameError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={renameLoading}
              onClick={() => {
                const nextName = renameValue.trim();
                if (!nextName) {
                  setRenameError("Area name is required");
                  return;
                }
                void onRename(nextName).then(
                  () => setRenameOpen(false),
                  (err: unknown) =>
                    setRenameError(err instanceof Error ? err.message : "Failed to rename area"),
                );
              }}
            >
              {renameLoading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
