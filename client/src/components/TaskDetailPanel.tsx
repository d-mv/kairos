import { useEffect, useRef, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import type { TaskDurationUnit, TaskPriority } from "@kairos/shared";
import { selectedTaskIdAtom, selectedTaskAtom, tasksAtom } from "../atoms/tasks.js";
import { SubtaskList } from "./SubtaskList.js";
import { api } from "../lib/api.js";
import { Button } from "./ui/button.js";
import { TrashIcon, XIcon } from "./ui/icons.js";
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
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const lastSyncedRef = useRef("");
  const savedIndicatorTimeoutRef = useRef<number | null>(null);

  const serializeTaskState = (value: {
    title: string;
    description: string;
    priority: TaskPriority;
    dueDate: string;
    duration: string;
    durationUnit: TaskDurationUnit | "";
  }) =>
    JSON.stringify({
      title: value.title.trim(),
      description: value.description,
      priority: value.priority,
      dueDate: value.dueDate,
      duration: value.duration,
      durationUnit: value.durationUnit,
    });

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? "");
      setPriority(task.priority);
      setDueDate(task.dueDate ?? "");
      setDuration(task.duration ? String(task.duration) : "");
      setDurationUnit(task.durationUnit ?? "");
      setSaveState("idle");
      lastSyncedRef.current = serializeTaskState({
        title: task.title,
        description: task.description ?? "",
        priority: task.priority,
        dueDate: task.dueDate ?? "",
        duration: task.duration ? String(task.duration) : "",
        durationUnit: task.durationUnit ?? "",
      });
    }
  }, [task]);

  if (!task) return null;

  const persistTaskChanges = async (overrides?: {
    title?: string;
    description?: string;
    priority?: TaskPriority;
    dueDate?: string;
    duration?: string;
    durationUnit?: TaskDurationUnit | "";
    silentValidation?: boolean;
  }) => {
    const nextTitle = overrides?.title ?? title;
    const nextDescription = overrides?.description ?? description;
    const nextPriority = overrides?.priority ?? priority;
    const nextDueDate = overrides?.dueDate ?? dueDate;
    const nextDuration = overrides?.duration ?? duration;
    const nextDurationUnit = overrides?.durationUnit ?? durationUnit;
    const nextSnapshot = serializeTaskState({
      title: nextTitle,
      description: nextDescription,
      priority: nextPriority,
      dueDate: nextDueDate,
      duration: nextDuration,
      durationUnit: nextDurationUnit,
    });

    if (nextSnapshot === lastSyncedRef.current) return;

    if (!nextTitle.trim()) return;

    let parsedDuration: number | null = null;
    let parsedDurationUnit: TaskDurationUnit | null = null;
    if (nextDuration !== "") {
      parsedDuration = Number(nextDuration);
      if (!Number.isInteger(parsedDuration) || parsedDuration <= 0) {
        if (!overrides?.silentValidation) {
          window.alert("Duration must be a positive whole number");
        }
        return;
      }
    }
    if (nextDurationUnit !== "") {
      parsedDurationUnit = nextDurationUnit;
    }
    if ((parsedDuration === null) !== (parsedDurationUnit === null)) {
      if (!overrides?.silentValidation) {
        window.alert("Set both duration and duration unit, or leave both empty");
      }
      setSaveState("error");
      return;
    }

    setSaving(true);
    setSaveState("saving");
    const previousTask = task;
    const previousSnapshot = lastSyncedRef.current;
    lastSyncedRef.current = nextSnapshot;
    const optimisticTask = {
      ...task,
      title: nextTitle.trim(),
      description: nextDescription || null,
      priority: nextPriority,
      dueDate: nextDueDate || null,
      duration: parsedDuration,
      durationUnit: parsedDurationUnit,
      updatedAt: new Date().toISOString(),
    };

    setTasks((prev) => prev.map((t) => (t.id === task.id ? optimisticTask : t)));

    try {
      const updated = await api.tasks.update(task.id, {
        title: nextTitle.trim(),
        description: nextDescription || null,
        priority: nextPriority,
        dueDate: nextDueDate || null,
        duration: parsedDuration,
        durationUnit: parsedDurationUnit,
      });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
      setSaveState("saved");
      if (savedIndicatorTimeoutRef.current) {
        window.clearTimeout(savedIndicatorTimeoutRef.current);
      }
      savedIndicatorTimeoutRef.current = window.setTimeout(() => {
        setSaveState("idle");
      }, 1500);
    } catch (err) {
      console.error("Failed to update task", err);
      lastSyncedRef.current = previousSnapshot;
      setSaveState("error");
      setTasks((prev) => prev.map((t) => (t.id === task.id ? previousTask : t)));
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    await persistTaskChanges();
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void persistTaskChanges({
        title,
        description,
        duration,
        silentValidation: true,
      });
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [description, duration, title]);

  useEffect(() => {
    return () => {
      if (savedIndicatorTimeoutRef.current) {
        window.clearTimeout(savedIndicatorTimeoutRef.current);
      }
    };
  }, []);

  const handleDelete = async () => {
    const previousTasks = (() => {
      let snapshot: (typeof task)[] = [];
      setTasks((prev) => {
        snapshot = prev.filter((t) => t.id === task.id || t.parentTaskId === task.id);
        return prev.filter((t) => t.id !== task.id && t.parentTaskId !== task.id);
      });
      return snapshot;
    })();
    setSelectedTaskId(null);

    try {
      await api.tasks.delete(task.id);
    } catch (err) {
      console.error("Failed to delete task", err);
      setTasks((prev) => {
        const existingIds = new Set(prev.map((t) => t.id));
        const restored = previousTasks.filter((item) => !existingIds.has(item.id));
        return [...prev, ...restored];
      });
      setSelectedTaskId(task.id);
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
    <div className="panel fixed inset-x-3 bottom-3 top-[11rem] z-10 flex flex-col rounded-[1.8rem] lg:inset-x-auto lg:bottom-4 lg:right-4 lg:top-4 lg:h-[calc(100%-2rem)] lg:w-[42rem]">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Inspector
          </p>
          <div className="mt-1 flex items-center gap-2">
            <h2 className="text-sm font-semibold">Task Details</h2>
            {saveState !== "idle" && (
              <span
                className={`rounded-full px-[1rem] py-[0.5rem] text-[1.1rem] leading-none ${
                  saveState === "saving"
                    ? "bg-sky-500/15 text-sky-700 dark:text-sky-300"
                    : saveState === "saved"
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      : "bg-destructive/15 text-destructive"
                }`}
              >
                {saveState === "saving" ? "Saving" : saveState === "saved" ? "Saved" : "Not saved"}
              </span>
            )}
          </div>
        </div>
        <Button
          onClick={() => setSelectedTaskId(null)}
          variant="ghost"
          size="icon"
          className="h-[3.2rem] w-[3.2rem] rounded-full"
          aria-label="Close task details"
        >
          <XIcon size={14} />
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

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="soft-panel rounded-[1.4rem] p-4">
            <Label>Priority</Label>
            <Select
              value={priority}
              onChange={(e) => {
                const nextPriority = Number(e.target.value) as TaskPriority;
                setPriority(nextPriority);
                void persistTaskChanges({ priority: nextPriority });
              }}
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
              onChange={(e) => {
                const nextDueDate = e.target.value;
                setDueDate(nextDueDate);
                void persistTaskChanges({ dueDate: nextDueDate });
              }}
              className="mt-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
              onChange={(e) => {
                const nextDurationUnit = e.target.value as TaskDurationUnit | "";
                setDurationUnit(nextDurationUnit);
                void persistTaskChanges({ durationUnit: nextDurationUnit });
              }}
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
          <TrashIcon size={16} />
          <span>Delete task</span>
        </Button>
      </div>
    </div>
  );
}
