import { useAtomValue } from 'jotai';
import { subtasksByParentAtom } from '../atoms/tasks.js';
import { TaskItem } from './TaskItem.js';
import { NewTaskInput } from './NewTaskInput.js';

interface SubtaskListProps {
  parentTaskId: string;
}

export function SubtaskList({ parentTaskId }: SubtaskListProps) {
  const subtasksByParent = useAtomValue(subtasksByParentAtom);
  const subtasks = subtasksByParent.get(parentTaskId) ?? [];

  return (
    <div className="mt-2">
      {subtasks.map(subtask => (
        <TaskItem key={subtask.id} task={subtask} isSubtask />
      ))}
      <div className="pl-6">
        <NewTaskInput parentTaskId={parentTaskId} placeholder="Add a subtask..." />
      </div>
    </div>
  );
}
