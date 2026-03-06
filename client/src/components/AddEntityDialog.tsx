import type { AreaDTO, ProjectDTO } from "@kairos/shared";
import { useAtom } from "jotai";
import { useSetAtom } from "jotai";
import { useState } from "react";
import { addEntityAtom } from "../atoms/addEntity.atom.js";
import { areasAtom } from "../atoms/areas.js";
import { projectsAtom } from "../atoms/projects.js";
import { api } from "../lib/api.js";
import { createOptimisticId } from "../lib/optimistic.js";
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

export function AddNewEntityDialog() {
  const [state, setState] = useAtom(addEntityAtom);
  const setAreas = useSetAtom(areasAtom);
  const setProjects = useSetAtom(projectsAtom);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = state !== null;

  const handleClose = () => {
    if (loading) return;
    setState(null);
    setName("");
    setError(null);
  };

  const handleCreate = async () => {
    if (!state) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setError(`${state.entityLabel} name is required`);
      return;
    }

    setLoading(true);
    setError(null);

    if (state.type === "area") {
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
        handleClose();
      } catch (err) {
        setAreas((prev) => prev.filter((item) => item.id !== optimisticArea.id));
        setError(err instanceof Error ? err.message : "Failed to create area");
      } finally {
        setLoading(false);
      }
      return;
    }

    const optimisticProject: ProjectDTO = {
      id: createOptimisticId("project"),
      name: trimmed,
      areaId: null,
      userId: "optimistic",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setProjects((prev) => [...prev, optimisticProject]);
    try {
      const project = await api.projects.create(trimmed);
      setProjects((prev) => {
        const withoutOptimistic = prev.filter((item) => item.id !== optimisticProject.id);
        if (withoutOptimistic.some((item) => item.id === project.id)) return withoutOptimistic;
        return [...withoutOptimistic, project];
      });
      handleClose();
    } catch (err) {
      setProjects((prev) => prev.filter((item) => item.id !== optimisticProject.id));
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => handleClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create {state?.entityLabel ?? "Item"}</DialogTitle>
          <DialogDescription>Add a new {state?.entityLabel?.toLowerCase() ?? "item"}.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 py-4">
          <Label>{state?.entityLabel ?? "Name"}</Label>
          <Input
            type="text"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleCreate();
              }
            }}
            placeholder={`Enter ${state?.entityLabel?.toLowerCase() ?? "item"}...`}
            disabled={loading}
            autoFocus
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={loading} onClick={handleClose}>
            Cancel
          </Button>
          <Button type="button" disabled={loading} onClick={() => void handleCreate()}>
            {loading ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
