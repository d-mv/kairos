import type { TaskDTO } from "@kairos/shared";
import { useSetAtom } from "jotai";
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
}

export function TaskList({
  tasks,
  projectId,
  areaId,
  emptyMessage,
  showNewTaskInput,
  isList,
  active,
}: TaskListProps) {
  const setSelectedTaskId = useSetAtom(selectedTaskIdAtom);
  const setTasks = useSetAtom(tasksAtom);

  const handleToggleComplete = (task: TaskDTO) => async (e: React.MouseEvent) => {
    e.stopPropagation();
    const previousTask = task;
    const optimisticTask: TaskDTO = {
      ...task,
      status: task.status === "done" ? "todo" : "done",
      updatedAt: new Date().toISOString(),
    };

    setTasks((prev) => prev.map((t) => (t.id === task.id ? optimisticTask : t)));

    const fn = task.status === "done" ? api.tasks.reopen : api.tasks.complete;

    try {
      const updated = await fn(task.id);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch (err) {
      const message = getTaskErrorMessage(err, "Failed to update task");
      console.error("Failed to complete task", err);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? previousTask : t)));
      window.alert(message);
    }
  };

  return (
    <ol className="">
      {tasks.length === 0 && emptyMessage && (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">{emptyMessage}</p>
      )}
      {tasks.map((task, i) => (
        <TaskItem
          key={task.id}
          isListItem={isList}
          task={task}
          isLast={i === tasks.length - 1}
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
