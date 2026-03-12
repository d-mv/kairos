import type { TaskDTO } from "@kairos/shared";
import { Text, TextInput } from "@mantine/core";
import { useSetAtom } from "jotai";
import { useState } from "react";
import { tasksAtom } from "../atoms/tasks.js";
import { api } from "../lib/api.js";
import { createOptimisticId } from "../lib/optimistic.js";
import { getTaskErrorMessage } from "../lib/task-errors.js";

interface NewTaskInputProps {
  projectId?: string;
  areaId?: string;
  parentTaskId?: string;
  placeholder?: string;
}

export function NewTaskInput({
  projectId,
  areaId,
  parentTaskId,
  placeholder = "Add a task...",
}: NewTaskInputProps) {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setTasks = useSetAtom(tasksAtom);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setTitle("");

    const optimisticTask: TaskDTO = {
      id: createOptimisticId("task"),
      title: trimmed,
      description: null,
      status: "todo",
      priority: 4,
      parentTaskId: parentTaskId ?? null,
      projectId: projectId ?? null,
      areaId: areaId ?? null,
      userId: "optimistic",
      dueDate: null,
      duration: null,
      durationUnit: null,
      position: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTasks((prev) => [...prev, optimisticTask]);

    try {
      const createInput: {
        title: string;
        projectId?: string;
        areaId?: string;
        parentTaskId?: string;
      } = { title: trimmed };
      if (projectId) createInput.projectId = projectId;
      if (areaId) createInput.areaId = areaId;
      if (parentTaskId) createInput.parentTaskId = parentTaskId;

      const task = await api.tasks.create(createInput);
      setTasks((prev) => {
        const withoutOptimistic = prev.filter((item) => item.id !== optimisticTask.id);
        if (withoutOptimistic.some((item) => item.id === task.id)) return withoutOptimistic;
        return [...withoutOptimistic, task];
      });
    } catch (err) {
      const message = getTaskErrorMessage(err, "Failed to create task");
      console.error("Failed to create task", err);
      setTasks((prev) => prev.filter((item) => item.id !== optimisticTask.id));
      setTitle(trimmed);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <TextInput
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
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
