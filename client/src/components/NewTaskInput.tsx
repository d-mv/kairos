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
      <form onSubmit={handleSubmit} className="flex items-center">
        <Input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (error) setError(null);
          }}
          placeholder={placeholder}
          disabled={loading}
          className="h-[5.6rem] flex-1 rounded-[1.8rem] px-[1.8rem] py-[1.1rem] text-[1.55rem] leading-tight"
        />
      </form>
      {error ? <p className="mt-2 px-1 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
