import type { TaskDTO, TaskDurationUnit, TaskPriority } from "@kairos/shared";
import checkIsMobile from "is-mobile";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import { selectedTaskAtom, selectedTaskIdAtom, tasksAtom } from "../../atoms/tasks.js";
import { api } from "../../lib/api.js";
import { getTaskErrorMessage } from "../../lib/task-errors.js";
import { SubtaskList } from "../SubtaskList.js";
import { Button } from "../ui/button.js";
import { TrashIcon, XIcon } from "../ui/icons.js";
import { Input } from "../ui/input.js";
import { Label } from "../ui/label.js";
import { Select } from "../ui/select.js";
import { Textarea } from "../ui/textarea.js";
import { MobileTaskDetailPanel } from "./MobileTaskDetailPanel.js";
import { SaveIndication } from "./SaveIndication.js";
import type { TaskDetailPanelController } from "./context.js";

export function TaskDetailPanel() {
  const setSelectedTaskId = useSetAtom(selectedTaskIdAtom);
  const task = useAtomValue(selectedTaskAtom);
  const setTasks = useSetAtom(tasksAtom);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>(4);
  const [dueDate, setDueDate] = useState("");
  const [duration, setDuration] = useState("");
  const [durationUnit, setDurationUnit] = useState<TaskDurationUnit | "">("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const lastSyncedRef = useRef("");
  const savedIndicatorTimeoutRef = useRef<number | null>(null);
  const selectedTaskIdRef = useRef<string | null>(null);

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
      const taskChanged = selectedTaskIdRef.current !== task.id;
      selectedTaskIdRef.current = task.id;
      setTitle(task.title);
      setDescription(task.description ?? "");
      setPriority(task.priority);
      setDueDate(task.dueDate ?? "");
      setDuration(task.duration ? String(task.duration) : "");
      setDurationUnit(task.durationUnit ?? "");
      if (taskChanged) {
        setSaveState("idle");
        setSaveError(null);
      }
      lastSyncedRef.current = serializeTaskState({
        title: task.title,
        description: task.description ?? "",
        priority: task.priority,
        dueDate: task.dueDate ?? "",
        duration: task.duration ? String(task.duration) : "",
        durationUnit: task.durationUnit ?? "",
      });
    } else {
      selectedTaskIdRef.current = null;
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
      setSaveError("Set both duration and duration unit, or leave both empty");
      return;
    }

    setSaveState("saving");
    setSaveError(null);
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
      setSaveError(null);
      if (savedIndicatorTimeoutRef.current) {
        window.clearTimeout(savedIndicatorTimeoutRef.current);
      }
      savedIndicatorTimeoutRef.current = window.setTimeout(() => {
        setSaveState("idle");
      }, 1500);
    } catch (err) {
      const message = getTaskErrorMessage(err, "Failed to update task");
      console.error("Failed to update task", err);
      lastSyncedRef.current = previousSnapshot;
      setSaveState("error");
      setSaveError(message);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? previousTask : t)));
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
      const message = getTaskErrorMessage(err, "Failed to delete task");
      console.error("Failed to delete task", err);
      setTasks((prev) => {
        const existingIds = new Set(prev.map((t) => t.id));
        const restored = previousTasks.filter((item) => !existingIds.has(item.id));
        return [...prev, ...restored];
      });
      setSelectedTaskId(task.id);
      window.alert(message);
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

  const handleToggleComplete = (task: TaskDTO) => async () => {
    const previousTask = task;
    const optimisticTask: TaskDTO = {
      ...task,
      status: task.status === "done" ? "todo" : "done",
      updatedAt: new Date().toISOString(),
    };

    setTasks((prev) => prev.map((t) => (t.id === task.id ? optimisticTask : t)));

    const fn = task.status === "done" ? api.tasks.reopen : api.tasks.complete;

    try {
      const updated = await fn(task.id);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch (err) {
      const message = getTaskErrorMessage(err, "Failed to update task");
      console.error("Failed to complete task", err);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? previousTask : t)));
      window.alert(message);
    }
  };

  const handleClose = () => {
    setSelectedTaskId(null);
  };

  const controller: TaskDetailPanelController = {
    saveState,
    saveError,
    task,
    title,
    description,
    priority,
    dueDate,
    duration,
    durationUnit,
    setTitle,
    setDescription,
    setPriority,
    setDueDate,
    setDuration,
    setDurationUnit,
    handleSave,
    handleDelete,
    handlePromote,
    handleClose,
    handleToggleComplete,
    persistTaskChanges,
  };

  if (checkIsMobile()) {
    return <MobileTaskDetailPanel controller={controller} />;
  }

  return (
    <div className="panel fixed inset-x-3 bottom-3 top-[11rem] z-10 flex flex-col rounded-[1.8rem] lg:inset-x-auto lg:bottom-4 lg:right-4 lg:top-4 lg:h-[calc(100%-2rem)] lg:w-[42rem]">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            Inspector
          </p>
          <div className="mt-1 flex items-center gap-2">
            <h2 className="text-sm font-semibold">Task Details</h2>
            <SaveIndication saveState={saveState} />
          </div>
        </div>
        <Button
          onClick={handleClose}
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
          {saveError ? <p className="mt-2 text-xs text-destructive">{saveError}</p> : null}
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
                  ? "bg-muted text-foreground"
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
        <Button
          onClick={handleDelete}
          className="w-full bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:text-white dark:hover:bg-red-500"
        >
          <TrashIcon size={16} />
          <span>Delete task</span>
        </Button>
      </div>
    </div>
  );
}
