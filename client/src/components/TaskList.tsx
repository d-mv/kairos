import type { TaskDTO } from "@kairos/shared";
import { TaskItem } from "./TaskItem.js";
import { NewTaskInput } from "./NewTaskInput.js";

interface TaskListProps {
  tasks: TaskDTO[];
  projectId?: string;
  areaId?: string;
  emptyMessage?: string;
  showNewTaskInput?: boolean;
}

export function TaskList({
  tasks,
  projectId,
  areaId,
  emptyMessage,
  showNewTaskInput = true,
}: TaskListProps) {
  const topLevelTasks = tasks.filter((t) => !t.parentTaskId);

  return (
    <div className="panel overflow-hidden rounded-[1.6rem]">
      {topLevelTasks.length === 0 && emptyMessage && (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">{emptyMessage}</p>
      )}
      {topLevelTasks.map((task) => (
        <TaskItem key={task.id} task={task} />
      ))}
      {showNewTaskInput ? <NewTaskInput projectId={projectId} areaId={areaId} /> : null}
    </div>
  );
}
