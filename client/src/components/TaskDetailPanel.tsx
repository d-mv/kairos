import { useState, useEffect } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import type { TaskDurationUnit, TaskPriority } from "@kairos/shared";
import { selectedTaskIdAtom, selectedTaskAtom, tasksAtom } from "../atoms/tasks.js";
import { SubtaskList } from "./SubtaskList.js";
import { api } from "../lib/api.js";
import { Button } from "./ui/button.js";
import { Input } from "./ui/input.js";
import { Label } from "./ui/label.js";
import { Select } from "./ui/select.js";
import { Textarea } from "./ui/textarea.js";

export function TaskDetailPanel() {
  const setSelectedTaskId = useSetAtom(selectedTaskIdAtom);
  const task = useAtomValue(selectedTaskAtom);
  const setTasks = useSetAtom(tasksAtom);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>(1);
  const [dueDate, setDueDate] = useState("");
  const [duration, setDuration] = useState("");
  const [durationUnit, setDurationUnit] = useState<TaskDurationUnit | "">("");
  const [_saving, setSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? "");
      setPriority(task.priority);
      setDueDate(task.dueDate ?? "");
      setDuration(task.duration ? String(task.duration) : "");
      setDurationUnit(task.durationUnit ?? "");
    }
  }, [task]);

  if (!task) return null;

  const handleSave = async () => {
    if (!title.trim()) return;

    let parsedDuration: number | null = null;
    let parsedDurationUnit: TaskDurationUnit | null = null;
    if (duration !== "") {
      parsedDuration = Number(duration);
      if (!Number.isInteger(parsedDuration) || parsedDuration <= 0) {
        window.alert("Duration must be a positive whole number");
        return;
      }
    }
    if (durationUnit !== "") {
      parsedDurationUnit = durationUnit;
    }
    if ((parsedDuration === null) !== (parsedDurationUnit === null)) {
      window.alert("Set both duration and duration unit, or leave both empty");
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
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch (err) {
      console.error("Failed to update task", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.tasks.delete(task.id);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      setSelectedTaskId(null);
    } catch (err) {
      console.error("Failed to delete task", err);
    }
  };

  const handlePromote = async () => {
    try {
      const project = await api.tasks.promote(task.id);
      setTasks((prev) => prev.filter((t) => t.id !== task.id && t.parentTaskId !== task.id));
      setSelectedTaskId(null);
      // Projects atom will be updated via WebSocket or re-fetch
      window.location.href = `/project/${project.id}`;
    } catch (err) {
      console.error("Failed to promote task", err);
      const message = err instanceof Error ? err.message : "Failed to promote task";
      window.alert(message);
    }
  };

  return (
    <div className="panel fixed right-4 top-4 z-10 flex h-[calc(100%-2rem)] w-[26rem] flex-col rounded-[1.8rem]">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Inspector
          </p>
          <h2 className="mt-1 text-sm font-semibold">Task Details</h2>
        </div>
        <Button
          onClick={() => setSelectedTaskId(null)}
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full"
        >
          ✕
        </Button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
        <div className="soft-panel rounded-[1.4rem] p-4">
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleSave}
            className="h-auto border-none bg-transparent px-0 py-1 text-lg font-semibold shadow-none focus-visible:ring-0"
          />
        </div>

        <div className="soft-panel rounded-[1.4rem] p-4">
          <Label>Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleSave}
            placeholder="Add a description..."
            rows={4}
            className="mt-2 resize-none border-none bg-transparent px-0 shadow-none focus-visible:ring-0"
          />
        </div>

        <div className="soft-panel flex items-center gap-2 rounded-[1.4rem] p-4">
          <span className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
            Status
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-xs ${
              task.status === "done"
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
                : task.status === "in_progress"
                  ? "bg-sky-500/15 text-sky-700 dark:text-sky-300"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {task.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="soft-panel rounded-[1.4rem] p-4">
            <Label>Priority</Label>
            <Select
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value) as TaskPriority)}
              onBlur={handleSave}
              className="mt-2"
            >
              <option value={1}>P1</option>
              <option value={2}>P2</option>
              <option value={3}>P3</option>
              <option value={4}>P4</option>
            </Select>
          </div>
          <div className="soft-panel rounded-[1.4rem] p-4">
            <Label>Due date</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              onBlur={handleSave}
              className="mt-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="soft-panel rounded-[1.4rem] p-4">
            <Label>Duration</Label>
            <Input
              type="number"
              min={1}
              step={1}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              onBlur={handleSave}
              placeholder="e.g. 2"
              className="mt-2"
            />
          </div>
          <div className="soft-panel rounded-[1.4rem] p-4">
            <Label>Unit</Label>
            <Select
              value={durationUnit}
              onChange={(e) => setDurationUnit(e.target.value as TaskDurationUnit | "")}
              onBlur={handleSave}
              className="mt-2"
            >
              <option value="">None</option>
              <option value="h">Hours</option>
              <option value="d">Days</option>
              <option value="w">Weeks</option>
              <option value="m">Months</option>
            </Select>
          </div>
        </div>

        {!task.parentTaskId && (
          <div className="soft-panel rounded-[1.4rem] p-4">
            <label className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
              Subtasks
            </label>
            <SubtaskList parentTaskId={task.id} />
          </div>
        )}
      </div>

      <div className="space-y-2 border-t border-border p-5">
        {!task.parentTaskId && (
          <Button onClick={handlePromote} className="w-full" variant="outline">
            Promote to Project
          </Button>
        )}
        <Button onClick={handleDelete} className="w-full" variant="destructive">
          Delete task
        </Button>
      </div>
    </div>
  );
}
