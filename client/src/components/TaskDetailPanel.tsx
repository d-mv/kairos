import { useState, useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import type { TaskDurationUnit, TaskPriority } from '@kairos/shared';
import { selectedTaskIdAtom, selectedTaskAtom, tasksAtom } from '../atoms/tasks.js';
import { SubtaskList } from './SubtaskList.js';
import { api } from '../lib/api.js';

export function TaskDetailPanel() {
  const setSelectedTaskId = useSetAtom(selectedTaskIdAtom);
  const task = useAtomValue(selectedTaskAtom);
  const setTasks = useSetAtom(tasksAtom);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>(1);
  const [dueDate, setDueDate] = useState('');
  const [duration, setDuration] = useState('');
  const [durationUnit, setDurationUnit] = useState<TaskDurationUnit | ''>('');
  const [_saving, setSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? '');
      setPriority(task.priority);
      setDueDate(task.dueDate ?? '');
      setDuration(task.duration ? String(task.duration) : '');
      setDurationUnit(task.durationUnit ?? '');
    }
  }, [task]);

  if (!task) return null;

  const handleSave = async () => {
    if (!title.trim()) return;

    let parsedDuration: number | null = null;
    let parsedDurationUnit: TaskDurationUnit | null = null;
    if (duration !== '') {
      parsedDuration = Number(duration);
      if (!Number.isInteger(parsedDuration) || parsedDuration <= 0) {
        window.alert('Duration must be a positive whole number');
        return;
      }
    }
    if (durationUnit !== '') {
      parsedDurationUnit = durationUnit;
    }
    if ((parsedDuration === null) !== (parsedDurationUnit === null)) {
      window.alert('Set both duration and duration unit, or leave both empty');
      return;
    }

    setSaving(true);
    try {
      const updated = await api.tasks.update(task.id, {
        title: title.trim(),
        description: description || null,
        priority,
        dueDate: dueDate || null,
        duration: parsedDuration,
        durationUnit: parsedDurationUnit,
      });
      setTasks(prev => prev.map(t => (t.id === task.id ? updated : t)));
    } catch (err) {
      console.error('Failed to update task', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.tasks.delete(task.id);
      setTasks(prev => prev.filter(t => t.id !== task.id));
      setSelectedTaskId(null);
    } catch (err) {
      console.error('Failed to delete task', err);
    }
  };

  const handlePromote = async () => {
    try {
      const project = await api.tasks.promote(task.id);
      setTasks(prev => prev.filter(t => t.id !== task.id && t.parentTaskId !== task.id));
      setSelectedTaskId(null);
      // Projects atom will be updated via WebSocket or re-fetch
      window.location.href = `/project/${project.id}`;
    } catch (err) {
      console.error('Failed to promote task', err);
      const message = err instanceof Error ? err.message : 'Failed to promote task';
      window.alert(message);
    }
  };

  return (
    <div className="fixed right-0 top-0 h-full w-96 border-l border-border bg-background shadow-xl z-10 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="font-semibold text-sm">Task Details</h2>
        <button
          onClick={() => setSelectedTaskId(null)}
          className="text-muted-foreground hover:text-foreground"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Title */}
        <div>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={handleSave}
            className="w-full text-lg font-medium bg-transparent outline-none border-b border-transparent focus:border-border pb-1"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-medium text-muted-foreground">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            onBlur={handleSave}
            placeholder="Add a description..."
            rows={4}
            className="w-full mt-1 text-sm bg-transparent outline-none resize-none border border-border rounded-md p-2 focus:border-ring"
          />
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Status</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              task.status === 'done'
                ? 'bg-green-100 text-green-700'
                : task.status === 'in_progress'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {task.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Priority</label>
            <select
              value={priority}
              onChange={e => setPriority(Number(e.target.value) as TaskPriority)}
              onBlur={handleSave}
              className="w-full mt-1 text-sm bg-transparent outline-none border border-border rounded-md p-2 focus:border-ring"
            >
              <option value={1}>P1</option>
              <option value={2}>P2</option>
              <option value={3}>P3</option>
              <option value={4}>P4</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Due date</label>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              onBlur={handleSave}
              className="w-full mt-1 text-sm bg-transparent outline-none border border-border rounded-md p-2 focus:border-ring"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Duration</label>
            <input
              type="number"
              min={1}
              step={1}
              value={duration}
              onChange={e => setDuration(e.target.value)}
              onBlur={handleSave}
              placeholder="e.g. 2"
              className="w-full mt-1 text-sm bg-transparent outline-none border border-border rounded-md p-2 focus:border-ring"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Unit</label>
            <select
              value={durationUnit}
              onChange={e => setDurationUnit(e.target.value as TaskDurationUnit | '')}
              onBlur={handleSave}
              className="w-full mt-1 text-sm bg-transparent outline-none border border-border rounded-md p-2 focus:border-ring"
            >
              <option value="">None</option>
              <option value="h">Hours</option>
              <option value="d">Days</option>
              <option value="w">Weeks</option>
              <option value="m">Months</option>
            </select>
          </div>
        </div>

        {/* Subtasks (only for top-level tasks) */}
        {!task.parentTaskId && (
          <div>
            <label className="text-xs font-medium text-muted-foreground">Subtasks</label>
            <SubtaskList parentTaskId={task.id} />
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="p-4 border-t border-border space-y-2">
        {!task.parentTaskId && (
          <button
            onClick={handlePromote}
            className="w-full text-sm text-center py-2 border border-border rounded-md hover:bg-accent transition-colors"
          >
            Promote to Project
          </button>
        )}
        <button
          onClick={handleDelete}
          className="w-full text-sm text-center py-2 text-destructive hover:bg-destructive/10 rounded-md transition-colors"
        >
          Delete task
        </button>
      </div>
    </div>
  );
}
