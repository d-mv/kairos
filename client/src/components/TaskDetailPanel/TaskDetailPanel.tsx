import type { TaskDTO, TaskDurationUnit, TaskPriority } from "@kairos/shared";
import {
  Box,
  Button,
  Divider,
  Group,
  Modal,
  NativeSelect,
  Stack,
  TagsInput,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";
import checkIsMobile from "is-mobile";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import { shareDialogAtom } from "../../atoms/shareDialog.js";
import { selectedTaskAtom, selectedTaskIdAtom, tasksAtom } from "../../atoms/tasks.js";
import { api } from "../../lib/api.js";
import {
  getTaskDetailSavePayload,
  hasTaskDetailDraftChanges,
} from "../../lib/task-detail-draft.js";
import { getTaskErrorMessage } from "../../lib/task-errors.js";
import { toInputDate, toInputTime } from "../../lib/utils.js";
import { SubtaskList } from "../SubtaskList.js";
import { TrashIcon } from "../ui/icons.js";
import { DurationInput } from "./DurationInput.js";
import { MobileTaskDetailPanel } from "./MobileTaskDetailPanel.js";
import { SaveIndication } from "./SaveIndication.js";
import type { TaskDetailPanelController } from "./context.js";

export function TaskDetailPanel() {
  const setSelectedTaskId = useSetAtom(selectedTaskIdAtom);
  const task = useAtomValue(selectedTaskAtom);
  const tasks = useAtomValue(tasksAtom);
  const setTasks = useSetAtom(tasksAtom);
  const setShareDialog = useSetAtom(shareDialogAtom);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [priority, setPriority] = useState<TaskPriority>(4);
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [duration, setDuration] = useState("");
  const [durationUnit, setDurationUnit] = useState<TaskDurationUnit | "">("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const lastSyncedRef = useRef<{
    title: string;
    description: string;
    tags: string[];
    priority: TaskPriority;
    dueDate: string;
    dueTime: string;
    duration: string;
    durationUnit: TaskDurationUnit | "";
  } | null>(null);
  const savedIndicatorTimeoutRef = useRef<number | null>(null);
  const selectedTaskIdRef = useRef<string | null>(null);
  const latestDraftRef = useRef<{
    title: string;
    description: string;
    tags: string[];
    priority: TaskPriority;
    dueDate: string;
    dueTime: string;
    duration: string;
    durationUnit: TaskDurationUnit | "";
  } | null>(null);

  useEffect(() => {
    if (task) {
      const taskChanged = selectedTaskIdRef.current !== task.id;
      selectedTaskIdRef.current = task.id;
      setTitle(task.title);
      setDescription(task.description ?? "");
      setTags(task.parentTaskId ? [] : task.tags);
      setPriority(task.priority);
      setDueDate(toInputDate(task.dueDate));
      setDueTime(toInputTime(task.dueDate));
      setDuration(task.duration ? String(task.duration) : "");
      setDurationUnit(task.durationUnit ?? "");
      if (taskChanged) {
        setSaveState("idle");
        setSaveError(null);
      }
      lastSyncedRef.current = {
        title: task.title,
        description: task.description ?? "",
        tags: task.parentTaskId ? [] : task.tags,
        priority: task.priority,
        dueDate: toInputDate(task.dueDate),
        dueTime: toInputTime(task.dueDate),
        duration: task.duration ? String(task.duration) : "",
        durationUnit: task.durationUnit ?? "",
      };
      latestDraftRef.current = {
        title: task.title,
        description: task.description ?? "",
        tags: task.parentTaskId ? [] : task.tags,
        priority: task.priority,
        dueDate: toInputDate(task.dueDate),
        dueTime: toInputTime(task.dueDate),
        duration: task.duration ? String(task.duration) : "",
        durationUnit: task.durationUnit ?? "",
      };
    } else {
      selectedTaskIdRef.current = null;
    }
  }, [task]);

  useEffect(() => {
    latestDraftRef.current = {
      title,
      description,
      tags,
      priority,
      dueDate,
      dueTime,
      duration,
      durationUnit,
    };
  }, [description, dueDate, dueTime, duration, durationUnit, priority, tags, title]);

  const persistTaskChanges = async (overrides?: {
    title?: string;
    description?: string;
    tags?: string[];
    priority?: TaskPriority;
    dueDate?: string;
    dueTime?: string;
    duration?: string;
    durationUnit?: TaskDurationUnit | "";
    silentValidation?: boolean;
  }) => {
    if (!task) return;
    const nextTitle = overrides?.title ?? title;
    const nextDescription = overrides?.description ?? description;
    const nextTags = task.parentTaskId ? [] : (overrides?.tags ?? tags);
    const nextPriority = overrides?.priority ?? priority;
    const nextDueDate = overrides?.dueDate ?? dueDate;
    const nextDueTime = overrides?.dueTime ?? dueTime;
    const nextDuration = overrides?.duration ?? duration;
    const nextDurationUnit = overrides?.durationUnit ?? durationUnit;
    const savedState = lastSyncedRef.current;
    if (!savedState) return;

    if (
      !hasTaskDetailDraftChanges({
        savedTitle: savedState.title,
        savedDescription: savedState.description,
        savedTags: savedState.tags,
        savedPriority: savedState.priority,
        savedDueDate: savedState.dueDate,
        savedDueTime: savedState.dueTime,
        savedDuration: savedState.duration,
        savedDurationUnit: savedState.durationUnit,
        title: nextTitle,
        description: nextDescription,
        tags: nextTags,
        priority: nextPriority,
        dueDate: nextDueDate,
        dueTime: nextDueTime,
        duration: nextDuration,
        durationUnit: nextDurationUnit,
      })
    ) {
      return;
    }

    const savePayload = getTaskDetailSavePayload({
      title: nextTitle,
      description: nextDescription,
      tags: nextTags,
      priority: nextPriority,
      dueDate: nextDueDate,
      dueTime: nextDueTime,
      duration: nextDuration,
      durationUnit: nextDurationUnit,
    });

    if (!savePayload.ok) {
      if (!overrides?.silentValidation && savePayload.error !== "Title is required") {
        window.alert(savePayload.error);
      }
      if (savePayload.error !== "Title is required") {
        setSaveState("error");
        setSaveError(savePayload.error);
      }
      return;
    }

    setSaveState("saving");
    setSaveError(null);
    const previousTask = task;
    const previousSnapshot = lastSyncedRef.current;
    lastSyncedRef.current = {
      title: savePayload.payload.title,
      description: savePayload.payload.description ?? "",
      tags: savePayload.payload.tags,
      priority: savePayload.payload.priority,
      dueDate: toInputDate(savePayload.payload.dueDate),
      dueTime: toInputTime(savePayload.payload.dueDate),
      duration: savePayload.payload.duration ? String(savePayload.payload.duration) : "",
      durationUnit: savePayload.payload.durationUnit ?? "",
    };
    const optimisticTask = {
      ...task,
      ...savePayload.payload,
      updatedAt: new Date().toISOString(),
    };

    setTasks((prev) => prev.map((t) => (t.id === task.id ? optimisticTask : t)));

    try {
      const updated = await api.tasks.update(task.id, {
        ...savePayload.payload,
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
    return () => {
      if (savedIndicatorTimeoutRef.current) window.clearTimeout(savedIndicatorTimeoutRef.current);
      if (!latestDraftRef.current) return;
      void persistTaskChanges({ ...latestDraftRef.current, silentValidation: true });
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

  const handleClose = async () => {
    if (latestDraftRef.current) {
      await persistTaskChanges({ ...latestDraftRef.current, silentValidation: true });
    }
    setSelectedTaskId(null);
  };

  const controller: TaskDetailPanelController = {
    saveState,
    saveError,
    task,
    title,
    description,
    tags,
    tagOptions: Array.from(
      new Set(
        tasks
          .filter((item) => item.id !== task.id && item.parentTaskId === null)
          .flatMap((item) => item.tags)
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0),
      ),
    ).sort((a, b) => a.localeCompare(b)),
    priority,
    dueDate,
    dueTime,
    duration,
    durationUnit,
    setTitle,
    setDescription,
    setTags,
    setPriority,
    setDueDate,
    setDueTime,
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
          <Textarea
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleSave}
            autoFocus
            autosize
            minRows={1}
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

        {!task.parentTaskId ? (
          <TagsInput
            label="Tags"
            value={tags}
            onChange={setTags}
            onBlur={handleSave}
            data={controller.tagOptions}
            placeholder="Add tags"
            clearable
            splitChars={[","]}
          />
        ) : null}

        <Group gap="sm" align="flex-end" style={{ flexWrap: "nowrap" }}>
          <NativeSelect
            label="Priority"
            value={priority}
            w={68}
            onChange={(e) => {
              const nextPriority = Number(e.target.value) as TaskPriority;
              setPriority(nextPriority);
            }}
            onBlur={handleSave}
            data={[
              { value: "1", label: "1" },
              { value: "2", label: "2" },
              { value: "3", label: "3" },
              { value: "4", label: "4" },
            ]}
          />
          <Group gap="xs" style={{ flex: 1 }}>
            <TextInput
              label="Due date"
              type="date"
              value={dueDate}
              onChange={(e) => {
                const nextDueDate = e.target.value;
                setDueDate(nextDueDate);
              }}
              onBlur={handleSave}
              style={{ flex: 1 }}
            />
            <TextInput
              label="Time"
              type="time"
              value={dueTime}
              onChange={(e) => {
                const nextDueTime = e.target.value;
                setDueTime(nextDueTime);
              }}
              onBlur={handleSave}
              w={100}
            />
          </Group>
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
            variant="outline"
            size="sm"
            onClick={() =>
              setShareDialog({
                entityType: "task",
                entityId: task.id,
                entityLabel: task.title,
              })
            }
          >
            Share
          </Button>
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
