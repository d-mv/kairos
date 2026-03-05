import { useAtomValue } from "jotai";
import { subtasksByParentAtom } from "../atoms/tasks.js";
import { NewTaskInput } from "./NewTaskInput.js";
import { TaskList } from "./TaskList.js";

interface SubtaskListProps {
  parentTaskId: string;
}

export function SubtaskList({ parentTaskId }: SubtaskListProps) {
  const subtasksByParent = useAtomValue(subtasksByParentAtom);
  const subtasks = subtasksByParent.get(parentTaskId) ?? [];

  return (
    <div className="mt-3 overflow-hidden rounded-[1.2rem] border border-border/70 bg-background/40">
      <TaskList tasks={subtasks} showNewTaskInput={false} />
      <div className="pl-6">
        <NewTaskInput parentTaskId={parentTaskId} placeholder="Add a subtask..." />
      </div>
    </div>
  );
}
