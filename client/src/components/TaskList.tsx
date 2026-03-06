import type { TaskDTO } from "@kairos/shared";
import { useSetAtom } from "jotai";
import { useEffect, useMemo, useRef, useState } from "react";
import { selectedTaskIdAtom, tasksAtom } from "../atoms/tasks.js";
import { api } from "../lib/api.js";
import { getTaskErrorMessage } from "../lib/task-errors.js";
import { NewTaskInput } from "./NewTaskInput.js";
import { TaskItem } from "./TaskItem.js";

interface TaskListProps {
  tasks: TaskDTO[];
  projectId?: string;
  areaId?: string;
  emptyMessage?: string;
  showNewTaskInput?: boolean;
  isList?: boolean;
  active?: boolean;
  appearance?: "desktop" | "mobile";
  hideCompleted?: boolean;
}

export function TaskList({
  tasks,
  projectId,
  areaId,
  emptyMessage,
  showNewTaskInput = true,
  isList,
  active,
  appearance = "desktop",
  hideCompleted = false,
}: TaskListProps) {
  const setSelectedTaskId = useSetAtom(selectedTaskIdAtom);
  const setTasks = useSetAtom(tasksAtom);
  const [lingeringCompletedTasks, setLingeringCompletedTasks] = useState<
    Record<string, { task: TaskDTO; index: number }>
  >({});
  const lingeringTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    return () => {
      Object.values(lingeringTimeoutsRef.current).forEach((timeoutId) => clearTimeout(timeoutId));
    };
  }, []);

  const removeLingeringTask = (taskId: string) => {
    const timeoutId = lingeringTimeoutsRef.current[taskId];
    if (timeoutId) {
      clearTimeout(timeoutId);
      delete lingeringTimeoutsRef.current[taskId];
    }
    setLingeringCompletedTasks((prev) => {
      if (!(taskId in prev)) return prev;
      const next = { ...prev };
      delete next[taskId];
      return next;
    });
  };

  const addLingeringTask = (task: TaskDTO, index: number) => {
    removeLingeringTask(task.id);
    setLingeringCompletedTasks((prev) => ({
      ...prev,
      [task.id]: { task, index },
    }));
    lingeringTimeoutsRef.current[task.id] = setTimeout(() => {
      removeLingeringTask(task.id);
    }, 1000);
  };

  const handleToggleComplete = (task: TaskDTO) => async () => {
    const previousTask = task;
    const optimisticTask: TaskDTO = {
      ...task,
      status: task.status === "done" ? "todo" : "done",
      updatedAt: new Date().toISOString(),
    };
    const taskIndex = visibleTasks.findIndex((t) => t.id === task.id);

    if (task.status !== "done" && taskIndex >= 0) {
      addLingeringTask(optimisticTask, taskIndex);
    }

    setTasks((prev) => prev.map((t) => (t.id === task.id ? optimisticTask : t)));

    const fn = task.status === "done" ? api.tasks.reopen : api.tasks.complete;

    try {
      const updated = await fn(task.id);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
      if (updated.status !== "done") {
        removeLingeringTask(task.id);
      }
    } catch (err) {
      const message = getTaskErrorMessage(err, "Failed to update task");
      console.error("Failed to complete task", err);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? previousTask : t)));
      removeLingeringTask(task.id);
      window.alert(message);
    }
  };

  const visibleTasks = useMemo(
    () => (hideCompleted ? tasks.filter((task) => task.status !== "done") : tasks),
    [hideCompleted, tasks],
  );

  const renderedTasks = useMemo(() => {
    const currentTaskIds = new Set(visibleTasks.map((task) => task.id));
    const result = [...visibleTasks];
    const lingering = Object.values(lingeringCompletedTasks)
      .filter(({ task }) => !currentTaskIds.has(task.id))
      .sort((a, b) => a.index - b.index);

    lingering.forEach(({ task, index }) => {
      const insertionIndex = Math.max(0, Math.min(index, result.length));
      result.splice(insertionIndex, 0, task);
    });

    return result;
  }, [visibleTasks, lingeringCompletedTasks]);

  return (
    <ol className={appearance === "mobile" ? "space-y-1 px-1" : "space-y-0.5"}>
      {renderedTasks.length === 0 && emptyMessage && (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">{emptyMessage}</p>
      )}
      {renderedTasks.map((task, i) => (
        <TaskItem
          appearance={appearance}
          key={task.id}
          isListItem={isList}
          task={task}
          isLast={i === renderedTasks.length - 1}
          isActive={isList || active ? true : false}
          handleClick={(e) => {
            e.stopPropagation();
            setSelectedTaskId(task.id);
          }}
          handleToggleComplete={handleToggleComplete(task)}
        />
      ))}
      <div className="mbe-2" />
      {showNewTaskInput ? <NewTaskInput projectId={projectId} areaId={areaId} /> : null}
    </ol>
  );
}
