import { useSetAtom } from "jotai";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { projectsAtom } from "../atoms/projects.js";
import { api } from "../lib/api.js";
import { Button, type ButtonProps } from "./ui/button.js";
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

interface CreateProjectButtonProps {
  label: string;
  className?: string;
  areaId?: string;
  navigateToProject?: boolean;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
}

export function CreateProjectButton({
  label,
  className,
  areaId,
  navigateToProject = false,
  variant = "ghost",
  size = "default",
}: CreateProjectButtonProps) {
  const setProjects = useSetAtom(projectsAtom);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
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
    try {
      const project = await api.projects.create(trimmed, areaId);
      setProjects((prev) => [...prev, project]);
      setOpen(false);
      setName("");
      if (navigateToProject) {
        navigate(`/project/${project.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} className={className} variant={variant} size={size}>
        {label}
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
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription>Create a new project in your workspace.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 px-4 py-4">
            <Label>Project name</Label>
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
              <Button type="button" onClick={handleCreateProject} size="sm" disabled={loading}>
                {loading ? "Creating..." : "Create"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
