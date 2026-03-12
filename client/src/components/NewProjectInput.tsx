import type { ProjectDTO } from "@kairos/shared";
import { Text, TextInput } from "@mantine/core";
import { useSetAtom } from "jotai";
import { useState } from "react";
import { projectsAtom } from "../atoms/projects.js";
import { api } from "../lib/api.js";
import { createOptimisticId } from "../lib/optimistic.js";

interface NewProjectInputProps {
  areaId?: string;
  placeholder?: string;
}

export function NewProjectInput({
  areaId,
  placeholder = "Add a project...",
}: NewProjectInputProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setProjects = useSetAtom(projectsAtom);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setName("");

    const optimisticProject: ProjectDTO = {
      id: createOptimisticId("project"),
      name: trimmed,
      areaId: areaId ?? null,
      userId: "optimistic",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setProjects((prev) => [...prev, optimisticProject]);

    try {
      const project = await api.projects.create(trimmed, areaId);
      setProjects((prev) => {
        const withoutOptimistic = prev.filter((item) => item.id !== optimisticProject.id);
        if (withoutOptimistic.some((item) => item.id === project.id)) return withoutOptimistic;
        return [...withoutOptimistic, project];
      });
    } catch (err) {
      setProjects((prev) => prev.filter((item) => item.id !== optimisticProject.id));
      setName(trimmed);
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <TextInput
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            if (error) setError(null);
          }}
          placeholder={placeholder}
          disabled={loading}
          size="sm"
          variant="filled"
        />
      </form>
      {error ? (
        <Text size="xs" c="red" mt={4}>
          {error}
        </Text>
      ) : null}
    </div>
  );
}
