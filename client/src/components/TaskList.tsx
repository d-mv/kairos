import type { TaskDTO } from "@kairos/shared";
import { TaskItem } from "./TaskItem.js";
import { NewTaskInput } from "./NewTaskInput.js";

interface TaskListProps {
  tasks: TaskDTO[];
  projectId?: string;
  areaId?: string;
  emptyMessage?: string;
}

export function TaskList({ tasks, projectId, areaId, emptyMessage }: TaskListProps) {
  const topLevelTasks = tasks.filter((t) => !t.parentTaskId);

  return (
    <div className="space-y-0.5">
      {topLevelTasks.length === 0 && emptyMessage && (
        <p className="px-4 py-8 text-center text-muted-foreground text-sm">{emptyMessage}</p>
      )}
      {topLevelTasks.map((task) => (
        <TaskItem key={task.id} task={task} />
      ))}
      <NewTaskInput projectId={projectId} areaId={areaId} />
    </div>
  );
}
