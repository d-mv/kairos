import type { AreaDTO } from "@kairos/shared";
import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button.js";
import { EllipsisVerticalIcon } from "./ui/heroicons.js";
import { Select } from "./ui/select.js";
import { RenameEntityButton } from "./RenameEntityButton.js";

type ProjectSettingsMenuProps = {
  projectName: string;
  projectAreaId: string | null;
  areas: AreaDTO[];
  renameLoading: boolean;
  deleteLoading: boolean;
  moveLoading: boolean;
  onRename: (name: string) => Promise<void>;
  onMoveToArea: (areaId: string) => Promise<void>;
  onDemote: () => Promise<void>;
  onDelete: () => Promise<void>;
};

export function ProjectSettingsMenu({
  projectName,
  projectAreaId,
  areas,
  renameLoading,
  deleteLoading,
  moveLoading,
  onRename,
  onMoveToArea,
  onDemote,
  onDelete,
}: ProjectSettingsMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

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
    <div className="relative" ref={menuRef}>
      <Button
        type="button"
        variant={open ? "outline" : "ghost"}
        size="icon"
        aria-label="Open project settings"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <EllipsisVerticalIcon className="h-5 w-5" />
      </Button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.8rem)] z-20 w-[22rem] rounded-[1.2rem] border border-[var(--color-sidebar-border)] bg-background/95 p-2 text-foreground shadow-[var(--shadow-panel)] backdrop-blur-xl">
          <p className="px-3 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Project settings
          </p>

          <div className="rounded-[1rem] px-2 py-2">
            <RenameEntityButton
              currentName={projectName}
              entityLabel="Project"
              loading={renameLoading}
              onRename={onRename}
              variant="ghost"
              size="sm"
              className="w-full justify-start"
            />
          </div>

          <div className="rounded-[1rem] px-3 py-2">
            <label className="text-xs font-medium text-muted-foreground">Area</label>
            <Select
              value={projectAreaId ?? ""}
              onChange={(e) => {
                void onMoveToArea(e.target.value);
              }}
              className="mt-2 w-full"
              disabled={deleteLoading || moveLoading}
            >
              <option value="">Unassigned</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </Select>
          </div>

          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-[1rem] px-3 py-3 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            onClick={() => {
              setOpen(false);
              void onDemote();
            }}
            disabled={deleteLoading}
          >
            Demote to task
          </button>

          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-[1rem] px-3 py-3 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
            onClick={() => {
              setOpen(false);
              void onDelete();
            }}
            disabled={deleteLoading}
          >
            Delete project
          </button>
        </div>
      ) : null}
    </div>
  );
}
