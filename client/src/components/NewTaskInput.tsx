import type { TaskDTO } from "@kairos/shared";
import { useSetAtom } from "jotai";
import { useState } from "react";
import { tasksAtom } from "../atoms/tasks.js";
import { api } from "../lib/api.js";
import { createOptimisticId } from "../lib/optimistic.js";
import { getTaskErrorMessage } from "../lib/task-errors.js";
import { Input } from "./ui/input.js";

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
    <div className="flex flex-col">
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-3 border-t border-border/70 bg-muted/35 px-4 py-2"
      >
        <Input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (error) setError(null);
          }}
          placeholder={placeholder}
          disabled={loading}
          className="h-auto flex-1 border-none bg-transparent  px-0 py-0 text-base shadow-none focus-visible:ring-0"
        />
      </form>
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
