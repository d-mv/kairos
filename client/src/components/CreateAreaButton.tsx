import type { AreaDTO } from "@kairos/shared";
import { useSetAtom } from "jotai";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { areasAtom } from "../atoms/areas.js";
import { api } from "../lib/api.js";
import { createOptimisticId } from "../lib/optimistic.js";
import { cn } from "../lib/utils.js";
import { Button, type ButtonProps } from "./ui/button.js";
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

interface CreateAreaButtonProps {
  label: string;
  className?: string;
  navigateToArea?: boolean;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
}

export function CreateAreaButton({
  label,
  className,
  navigateToArea = false,
  variant = "ghost",
  size = "default",
}: CreateAreaButtonProps) {
  const setAreas = useSetAtom(areasAtom);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateArea = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Area name is required");
      return;
    }

    setLoading(true);
    setError(null);
    const optimisticArea: AreaDTO = {
      id: createOptimisticId("area"),
      name: trimmed,
      userId: "optimistic",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setAreas((prev) => [...prev, optimisticArea]);

    try {
      const area = await api.areas.create(trimmed);
      setAreas((prev) => {
        const withoutOptimistic = prev.filter((item) => item.id !== optimisticArea.id);
        if (withoutOptimistic.some((item) => item.id === area.id)) return withoutOptimistic;
        return [...withoutOptimistic, area];
      });
      setOpen(false);
      setName("");
      if (navigateToArea) {
        navigate(`/area/${area.id}`);
      }
    } catch (err) {
      setAreas((prev) => prev.filter((item) => item.id !== optimisticArea.id));
      setError(err instanceof Error ? err.message : "Failed to create area");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        variant={variant}
        size={size}
        className={cn(
          "justify-start rounded-2xl px-4 py-3 text-left text-sm font-light hover:bg-[var(--color-sidebar-accent)] hover:text-accent-foreground",
        )}
      >
        + New area
      </Button>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (loading) return;
          setOpen(nextOpen);
          if (!nextOpen) {
            setError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Area</DialogTitle>
            <DialogDescription>
              Create a new area for grouping projects and direct work.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 px-4 py-4">
            <Label>Area name</Label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleCreateArea();
                }
              }}
              placeholder="e.g. Product"
              disabled={loading}
              autoFocus
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                onClick={() => {
                  if (loading) return;
                  setOpen(false);
                  setError(null);
                }}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleCreateArea} size="sm" disabled={loading}>
                {loading ? "Creating..." : "Create"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
