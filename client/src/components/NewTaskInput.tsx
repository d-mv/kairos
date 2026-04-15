import type { TaskDTO } from "@kairos/shared";
import { Text, TextInput } from "@mantine/core";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import { tasksAtom } from "../atoms/tasks.js";
import { api } from "../lib/api.js";
import { shouldRestoreNewTaskInputFocus } from "../lib/new-task-input-focus.js";
import { createOptimisticId } from "../lib/optimistic.js";
import { getTaskErrorMessage } from "../lib/task-errors.js";
import { userAtom } from "../atoms/auth.js";

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
  const currentUser = useAtomValue(userAtom);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingFocusRestoreRef = useRef(false);
  const previousLoadingRef = useRef(false);

  useEffect(() => {
    if (
      shouldRestoreNewTaskInputFocus({
        wasLoading: previousLoadingRef.current,
        loading,
        pendingRestore: pendingFocusRestoreRef.current,
      })
    ) {
      inputRef.current?.focus();
      pendingFocusRestoreRef.current = false;
    }

    previousLoadingRef.current = loading;
  }, [loading]);

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
      userId: currentUser?.id ?? "optimistic",
      dueDate: null,
      duration: null,
      durationUnit: null,
      tags: [],
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
      pendingFocusRestoreRef.current = true;
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
          ref={inputRef}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (error) setError(null);
          }}
          placeholder={placeholder}
          disabled={loading}
          size="sm"
          variant="filled"
          styles={{ input: { fontSize: "16px" } }}
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
