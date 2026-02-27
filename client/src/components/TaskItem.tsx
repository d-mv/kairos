import { useSetAtom } from 'jotai';
import type { TaskDTO } from '@kairos/shared';
import { selectedTaskIdAtom } from '../atoms/tasks.js';
import { api } from '../lib/api.js';
import { tasksAtom } from '../atoms/tasks.js';
import { useSetAtom as useSet } from 'jotai';

interface TaskItemProps {
  task: TaskDTO;
  isSubtask?: boolean;
}

const PRIORITY_COLORS: Record<number, string> = {
  1: 'text-muted-foreground',
  2: 'text-blue-500',
  3: 'text-orange-500',
  4: 'text-red-500',
};

export function TaskItem({ task, isSubtask = false }: TaskItemProps) {
  const setSelectedTaskId = useSetAtom(selectedTaskIdAtom);
  const setTasks = useSet(tasksAtom);

  const handleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = await api.tasks.complete(task.id);
      setTasks(prev => prev.map(t => (t.id === task.id ? updated : t)));
    } catch (err) {
      console.error('Failed to complete task', err);
    }
  };

  const isDone = task.status === 'done';

  return (
    <div
      className={`flex items-center gap-3 px-4 py-2 hover:bg-accent/50 cursor-pointer rounded-md group ${
        isSubtask ? 'pl-10' : ''
      }`}
      onClick={() => setSelectedTaskId(task.id)}
    >
      {/* Checkbox */}
      <button
        onClick={handleComplete}
        className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${
          isDone
            ? 'bg-primary border-primary'
            : 'border-muted-foreground hover:border-primary'
        }`}
        title={isDone ? 'Completed' : 'Mark complete'}
      >
        {isDone && (
          <img src="/icons/check.svg" alt="" className="w-full h-full p-0.5 invert" />
        )}
      </button>

      {/* Priority dot */}
      <span
        className={`text-xs ${PRIORITY_COLORS[task.priority] ?? 'text-muted-foreground'}`}
        title={`Priority ${task.priority}`}
      >
        ●
      </span>

      {/* Title */}
      <span className={`flex-1 text-sm ${isDone ? 'line-through text-muted-foreground' : ''}`}>
        {task.title}
      </span>

      {/* Due date */}
      {task.dueDate && (
        <span className="text-xs text-muted-foreground">{task.dueDate}</span>
      )}
      {task.duration && task.durationUnit && (
        <span className="text-xs text-muted-foreground">
          {task.duration}{task.durationUnit}
        </span>
      )}
    </div>
  );
}
