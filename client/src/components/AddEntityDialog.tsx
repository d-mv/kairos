import type { AreaDTO, ProjectDTO } from "@kairos/shared";
import { Modal, TextInput } from "@mantine/core";
import { useAtom, useSetAtom } from "jotai";
import { useState } from "react";
import { addEntityAtom } from "../atoms/addEntity.atom.js";
import { areasAtom } from "../atoms/areas.js";
import { projectsAtom } from "../atoms/projects.js";
import { api } from "../lib/api.js";
import { createOptimisticId } from "../lib/optimistic.js";

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

    const areaId = state.areaId ?? null;
    const optimisticProject: ProjectDTO = {
      id: createOptimisticId("project"),
      name: trimmed,
      areaId,
      userId: "optimistic",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setProjects((prev) => [...prev, optimisticProject]);
    try {
      const project = await api.projects.create(trimmed, areaId ?? undefined);
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
    <Modal opened={open} onClose={handleClose} title={`New ${state?.entityLabel ?? "Item"}`}>
      <TextInput
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          if (error) setError(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void handleCreate();
          }
        }}
        placeholder={`${state?.entityLabel ?? "Item"} name...`}
        disabled={loading}
        error={error}
        autoFocus
      />
    </Modal>
  );
}
