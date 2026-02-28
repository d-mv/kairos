import { useState } from "react";
import { useSetAtom } from "jotai";
import type { TaskDTO } from "@kairos/shared";
import { tasksAtom } from "../atoms/tasks.js";
import { api } from "../lib/api.js";
import { createOptimisticId } from "../lib/optimistic.js";
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
  const setTasks = useSetAtom(tasksAtom);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    setLoading(true);
    setTitle("");

    const optimisticTask: TaskDTO = {
      id: createOptimisticId("task"),
      title: trimmed,
      description: null,
      status: "todo",
      priority: 1,
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
      console.error("Failed to create task", err);
      setTasks((prev) => prev.filter((item) => item.id !== optimisticTask.id));
      setTitle(trimmed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-3 border-t border-border/70 px-4 py-3"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent">
        <img src="/icons/plus.svg" alt="" className="h-4 w-4 opacity-60" />
      </div>
      <Input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={placeholder}
        disabled={loading}
        className="h-auto flex-1 border-none bg-transparent px-0 py-0 text-sm shadow-none focus-visible:ring-0"
      />
    </form>
  );
}
