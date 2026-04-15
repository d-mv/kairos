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
    <div>
      <TaskList tasks={subtasks} showNewTaskInput={false} hideCompleted />
      <div>
        <NewTaskInput parentTaskId={parentTaskId} placeholder="Add a subtask..." />
      </div>
    </div>
  );
}
