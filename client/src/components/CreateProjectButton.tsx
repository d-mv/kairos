import type { ProjectDTO } from "@kairos/shared";
import { Button, Group, Modal, NativeSelect, Stack, TextInput } from "@mantine/core";
import { useAtomValue, useSetAtom } from "jotai";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { areasAtom } from "../atoms/areas.js";
import { projectsAtom } from "../atoms/projects.js";
import { api } from "../lib/api.js";
import { createOptimisticId } from "../lib/optimistic.js";
import { Button as Btn, type ButtonProps } from "./ui/button.js";

interface CreateProjectButtonProps {
  label?: string;
  areaId?: string;
  navigateToProject?: boolean;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
}

export function CreateProjectButton({
  label = "New project",
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
      if (navigateToProject) navigate(`/project/${project.id}`);
    } catch (err) {
      setProjects((prev) => prev.filter((item) => item.id !== optimisticProject.id));
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Btn type="button" onClick={() => setOpen(true)} variant={variant} size={size}>
        {label}
      </Btn>
      <Modal
        opened={open}
        onClose={() => {
          if (loading) return;
          setOpen(false);
          setError(null);
          setSelectedAreaId(areaId ?? "");
        }}
        title="Create Project"
      >
        <Stack gap="sm">
          <TextInput
            label="Project"
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
            error={error}
            autoFocus
          />
          {!areaId && (
            <NativeSelect
              label="Area"
              value={selectedAreaId}
              onChange={(e) => setSelectedAreaId(e.target.value)}
              disabled={loading}
              data={[
                { value: "", label: "Unassigned" },
                ...areas.map((area) => ({ value: area.id, label: area.name })),
              ]}
            />
          )}
          <Group justify="flex-end" mt="xs">
            <Button
              variant="subtle"
              onClick={() => {
                if (loading) return;
                setOpen(false);
                setError(null);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateProject} disabled={loading}>
              {loading ? "Creating..." : "Create"}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
