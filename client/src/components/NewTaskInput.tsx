import { useState } from 'react';
import { useSetAtom } from 'jotai';
import { tasksAtom } from '../atoms/tasks.js';
import { api } from '../lib/api.js';

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
  placeholder = 'Add a task...',
}: NewTaskInputProps) {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const setTasks = useSetAtom(tasksAtom);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    setLoading(true);
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
      setTasks(prev => [...prev, task]);
      setTitle('');
    } catch (err) {
      console.error('Failed to create task', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 py-2">
      <img src="/icons/plus.svg" alt="" className="h-4 w-4 opacity-60" />
      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder={placeholder}
        disabled={loading}
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </form>
  );
}
