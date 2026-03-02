import { useSetAtom } from "jotai";
import type { TaskDTO } from "@kairos/shared";
import { selectedTaskIdAtom } from "../atoms/tasks.js";
import { api } from "../lib/api.js";
import { getTaskErrorMessage } from "../lib/task-errors.js";
import { tasksAtom } from "../atoms/tasks.js";
import { Button } from "./ui/button.js";
import { CheckIcon } from "./ui/icons.js";

interface TaskItemProps {
  task: TaskDTO;
  isSubtask?: boolean;
}

const PRIORITY_COLORS: Record<number, string> = {
  1: "text-muted-foreground",
  2: "text-blue-500",
  3: "text-orange-500",
  4: "text-red-500",
};

export function TaskItem({ task, isSubtask = false }: TaskItemProps) {
  const setSelectedTaskId = useSetAtom(selectedTaskIdAtom);
  const setTasks = useSetAtom(tasksAtom);

  const handleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const previousTask = task;
    const optimisticTask: TaskDTO = {
      ...task,
      status: task.status === "done" ? "todo" : "done",
      updatedAt: new Date().toISOString(),
    };

    setTasks((prev) => prev.map((t) => (t.id === task.id ? optimisticTask : t)));

    try {
      const updated = await api.tasks.complete(task.id);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch (err) {
      const message = getTaskErrorMessage(err, "Failed to update task");
      console.error("Failed to complete task", err);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? previousTask : t)));
      window.alert(message);
    }
  };

  const isDone = task.status === "done";

  return (
    <div
      className={`group flex cursor-pointer items-center gap-3 border-b border-border/70 px-4 py-3 transition-colors hover:bg-accent/50 ${
        isSubtask ? "pl-10" : ""
      }`}
      onClick={() => setSelectedTaskId(task.id)}
    >
      <Button
        onClick={handleComplete}
        variant="ghost"
        size="icon"
        className={`h-5 w-5 shrink-0 rounded-full border p-0 transition-colors ${
          isDone
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/50 bg-background hover:border-primary"
        }`}
        title={isDone ? "Completed" : "Mark complete"}
      >
        {isDone && <CheckIcon size={12} />}
      </Button>

      {/* Priority dot */}
      <span
        className={`text-xs ${PRIORITY_COLORS[task.priority] ?? "text-muted-foreground"}`}
        title={`Priority ${task.priority}`}
      >
        ●
      </span>

      <span
        className={`flex-1 text-sm font-medium ${isDone ? "text-muted-foreground line-through" : ""}`}
      >
        {task.title}
      </span>

      {task.dueDate && (
        <span className="rounded-full bg-muted px-[1rem] py-[0.6rem] text-[1.1rem] leading-none text-muted-foreground">
          {task.dueDate}
        </span>
      )}
      {task.duration && task.durationUnit && (
        <span className="rounded-full bg-muted px-[1rem] py-[0.6rem] text-[1.1rem] leading-none text-muted-foreground">
          {task.duration}
          {task.durationUnit}
        </span>
      )}
    </div>
  );
}
