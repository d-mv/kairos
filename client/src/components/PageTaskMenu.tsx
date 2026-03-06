import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button.js";
import { EllipsisVerticalIcon } from "./ui/heroicons.js";

interface PageTaskMenuProps {
  showCompleted: boolean;
  onToggleShowCompleted: () => void;
}

export function PageTaskMenu({ showCompleted, onToggleShowCompleted }: PageTaskMenuProps) {
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
        aria-label="Open page options"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <EllipsisVerticalIcon className="h-6 w-6" />
      </Button>
      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.6rem)] z-20 w-[19rem] rounded-xl border border-border/80 bg-card/95 p-2 text-foreground shadow-[var(--shadow-panel)] backdrop-blur-xl">
          <div className="flex items-center justify-between rounded-lg px-3 py-3">
            <span className="text-sm">Show completed</span>
            <button
              type="button"
              role="switch"
              aria-checked={showCompleted}
              onClick={onToggleShowCompleted}
              className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-colors ${
                showCompleted ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-background shadow transition-transform ${
                  showCompleted ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
