import type { ProjectDTO } from "@kairos/shared";
import { useAtomValue, useSetAtom } from "jotai";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { areasAtom } from "../atoms/areas.js";
import { projectsAtom } from "../atoms/projects.js";
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
import { Select } from "./ui/select.js";

interface CreateProjectButtonProps {
  label?: string;
  className?: string;
  areaId?: string;
  navigateToProject?: boolean;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
}

export function CreateProjectButton({
  label = "New project",
  className,
  areaId,
  navigateToProject = false,
  variant = "ghost",
  size = "default",
}: CreateProjectButtonProps) {
  const areas = useAtomValue(areasAtom);
  const setProjects = useSetAtom(projectsAtom);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [selectedAreaId, setSelectedAreaId] = useState(areaId ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateProject = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Project name is required");
      return;
    }

    setLoading(true);
    setError(null);
    const nextAreaId = areaId ?? (selectedAreaId || undefined);
    const optimisticProject: ProjectDTO = {
      id: createOptimisticId("project"),
      name: trimmed,
      areaId: nextAreaId ?? null,
      userId: "optimistic",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setProjects((prev) => [...prev, optimisticProject]);

    try {
      const project = await api.projects.create(trimmed, nextAreaId);
      setProjects((prev) => {
        const withoutOptimistic = prev.filter((item) => item.id !== optimisticProject.id);
        if (withoutOptimistic.some((item) => item.id === project.id)) return withoutOptimistic;
        return [...withoutOptimistic, project];
      });
      setOpen(false);
      setName("");
      setSelectedAreaId(areaId ?? "");
      if (navigateToProject) {
        navigate(`/project/${project.id}`);
      }
    } catch (err) {
      setProjects((prev) => prev.filter((item) => item.id !== optimisticProject.id));
      setError(err instanceof Error ? err.message : "Failed to create project");
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
        className={cn("w-full justify-start rounded-2xl px-4 py-3 text-left text-sm", className)}
      >
        {label}
      </Button>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (loading) return;
          setOpen(nextOpen);
          if (!nextOpen) {
            setError(null);
            setSelectedAreaId(areaId ?? "");
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription>Create a new project in your workspace.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <Label>Project</Label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleCreateProject();
                }
              }}
              placeholder="e.g. Website Redesign"
              disabled={loading}
              autoFocus
            />
            {!areaId && (
              <>
                <Label>Area</Label>
                <Select
                  value={selectedAreaId}
                  onChange={(e) => setSelectedAreaId(e.target.value)}
                  disabled={loading}
                >
                  <option value="">Unassigned</option>
                  {areas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </Select>
              </>
            )}
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => {
                if (loading) return;
                setOpen(false);
                setError(null);
              }}
              variant="outline"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleCreateProject} disabled={loading}>
              {loading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
