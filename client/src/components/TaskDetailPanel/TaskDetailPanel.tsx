import type { TaskDTO, TaskDurationUnit, TaskPriority } from "@kairos/shared";
import {
  Box,
  Button,
  Divider,
  Group,
  Modal,
  NativeSelect,
  Stack,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";
import checkIsMobile from "is-mobile";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import { selectedTaskAtom, selectedTaskIdAtom, tasksAtom } from "../../atoms/tasks.js";
import { api } from "../../lib/api.js";
import { getTaskErrorMessage } from "../../lib/task-errors.js";
import { SubtaskList } from "../SubtaskList.js";
import { TrashIcon } from "../ui/icons.js";
import { DurationInput } from "./DurationInput.js";
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

  const persistTaskChanges = async (overrides?: {
    title?: string;
    description?: string;
    priority?: TaskPriority;
    dueDate?: string;
    duration?: string;
    durationUnit?: TaskDurationUnit | "";
    silentValidation?: boolean;
  }) => {
    if (!task) return;
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
        if (!overrides?.silentValidation) window.alert("Duration must be a positive whole number");
        return;
      }
    }
    if (nextDurationUnit !== "") parsedDurationUnit = nextDurationUnit;
    if ((parsedDuration === null) !== (parsedDurationUnit === null)) {
      if (!overrides?.silentValidation)
        window.alert("Set both duration and duration unit, or leave both empty");
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
      if (savedIndicatorTimeoutRef.current) window.clearTimeout(savedIndicatorTimeoutRef.current);
      savedIndicatorTimeoutRef.current = window.setTimeout(() => setSaveState("idle"), 1500);
    } catch (err) {
      const message = getTaskErrorMessage(err, "Failed to update task");
      console.error("Failed to update task", err);
      lastSyncedRef.current = previousSnapshot;
      setSaveState("error");
      setSaveError(message);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? previousTask : t)));
    }
  };

  const handleSave = async () => persistTaskChanges();

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void persistTaskChanges({ title, description, duration, silentValidation: true });
    }, 500);
    return () => window.clearTimeout(timeoutId);
  }, [description, duration, title]);

  useEffect(() => {
    return () => {
      if (savedIndicatorTimeoutRef.current) window.clearTimeout(savedIndicatorTimeoutRef.current);
    };
  }, []);

  if (!task) return null;

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
      window.location.href = `/project/${project.id}`;
    } catch (err) {
      console.error("Failed to promote task", err);
      window.alert(err instanceof Error ? err.message : "Failed to promote task");
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

  const handleClose = () => setSelectedTaskId(null);

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

  if (checkIsMobile()) return <MobileTaskDetailPanel controller={controller} />;

  return (
    <Modal
      opened={true}
      onClose={handleClose}
      title={
        <Group gap="xs" align="center">
          <span>Task</span>
          <SaveIndication saveState={saveState} />
        </Group>
      }
      size="lg"
      styles={{
        body: { display: "flex", flexDirection: "column", overflow: "hidden", maxHeight: "70vh" },
      }}
    >
      <Stack gap="md" style={{ overflow: "hidden", flex: 1 }}>
        <Box>
          <TextInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleSave}
            autoFocus
          />
          {saveError ? (
            <Text size="xs" c="red" mt={4}>
              {saveError}
            </Text>
          ) : null}
        </Box>

        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={handleSave}
          placeholder="Add a description..."
          autosize
          minRows={3}
        />

        <Group gap="sm" align="flex-end" style={{ flexWrap: "nowrap" }}>
          <NativeSelect
            label="Priority"
            value={priority}
            w={68}
            onChange={(e) => {
              const nextPriority = Number(e.target.value) as TaskPriority;
              setPriority(nextPriority);
              void persistTaskChanges({ priority: nextPriority });
            }}
            data={[
              { value: "1", label: "1" },
              { value: "2", label: "2" },
              { value: "3", label: "3" },
              { value: "4", label: "4" },
            ]}
          />
          <Box style={{ flex: 1 }}>
            <TextInput
              label="Due date"
              type="date"
              value={dueDate}
              onChange={(e) => {
                const nextDueDate = e.target.value;
                setDueDate(nextDueDate);
                void persistTaskChanges({ dueDate: nextDueDate });
              }}
            />
          </Box>
          <Box w={120}>
            <DurationInput
              duration={duration}
              durationUnit={durationUnit}
              onQtyChange={(qty, resolvedUnit) => {
                setDuration(qty);
                setDurationUnit(resolvedUnit);
              }}
              onUnitChange={(unit) => {
                setDurationUnit(unit);
                void persistTaskChanges({ durationUnit: unit });
              }}
              onBlur={handleSave}
            />
          </Box>
        </Group>

        {!task.parentTaskId && (
          <Box style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <Text size="sm" fw={500} mb={8}>
              Subtasks
            </Text>
            <Box style={{ overflow: "auto", flex: 1 }}>
              <SubtaskList parentTaskId={task.id} />
            </Box>
          </Box>
        )}

        <Divider />
        <Group gap="sm">
          {!task.parentTaskId && (
            <Button variant="outline" size="sm" onClick={handlePromote}>
              Promote to Project
            </Button>
          )}
          <Button
            variant="subtle"
            color="red"
            size="sm"
            leftSection={<TrashIcon size={14} />}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
