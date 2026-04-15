import type { TaskDTO } from "@kairos/shared";
import { Box, Stack, Text } from "@mantine/core";
import { useSetAtom } from "jotai";
import { useEffect, useMemo, useRef, useState } from "react";
import { selectedTaskIdAtom, tasksAtom } from "../atoms/tasks.js";
import { api } from "../lib/api.js";
import { getTaskErrorMessage } from "../lib/task-errors.js";
import { NewTaskInput } from "./NewTaskInput.js";
import { TaskItem } from "./TaskItem.js";

const HOLD_MS = 400;

interface TaskListProps {
  tasks: TaskDTO[];
  projectId?: string;
  areaId?: string;
  emptyMessage?: string;
  showNewTaskInput?: boolean;
  isList?: boolean;
  active?: boolean;
  appearance?: "desktop" | "mobile";
  hideCompleted?: boolean;
  todayView?: boolean;
  showContext?: boolean;
}

export function TaskList({
  tasks,
  projectId,
  areaId,
  emptyMessage,
  showNewTaskInput = true,
  isList,
  active,
  appearance = "desktop",
  hideCompleted = false,
  todayView = false,
  showContext = false,
}: TaskListProps) {
  const setSelectedTaskId = useSetAtom(selectedTaskIdAtom);
  const setTasks = useSetAtom(tasksAtom);

  // ── Completed task lingering ──────────────────────────────────────────
  const [lingeringCompletedTasks, setLingeringCompletedTasks] = useState<
    Record<string, { task: TaskDTO; index: number }>
  >({});
  const lingeringTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    return () => {
      Object.values(lingeringTimeoutsRef.current).forEach((timeoutId) => clearTimeout(timeoutId));
    };
  }, []);

  const removeLingeringTask = (taskId: string) => {
    const timeoutId = lingeringTimeoutsRef.current[taskId];
    if (timeoutId) {
      clearTimeout(timeoutId);
      delete lingeringTimeoutsRef.current[taskId];
    }
    setLingeringCompletedTasks((prev) => {
      if (!(taskId in prev)) return prev;
      const next = { ...prev };
      delete next[taskId];
      return next;
    });
  };

  const addLingeringTask = (task: TaskDTO, index: number) => {
    removeLingeringTask(task.id);
    setLingeringCompletedTasks((prev) => ({
      ...prev,
      [task.id]: { task, index },
    }));
    lingeringTimeoutsRef.current[task.id] = setTimeout(() => {
      removeLingeringTask(task.id);
    }, 1000);
  };

  const handleToggleComplete = (task: TaskDTO) => async () => {
    const previousTask = task;
    const optimisticTask: TaskDTO = {
      ...task,
      status: task.status === "done" ? "todo" : "done",
      updatedAt: new Date().toISOString(),
    };
    const taskIndex = visibleTasks.findIndex((t) => t.id === task.id);

    if (task.status !== "done" && taskIndex >= 0) {
      addLingeringTask(optimisticTask, taskIndex);
    }

    setTasks((prev) => prev.map((t) => (t.id === task.id ? optimisticTask : t)));

    const fn = task.status === "done" ? api.tasks.reopen : api.tasks.complete;

    try {
      const updated = await fn(task.id);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
      if (updated.status !== "done") {
        removeLingeringTask(task.id);
      }
    } catch (err) {
      const message = getTaskErrorMessage(err, "Failed to update task");
      console.error("Failed to complete task", err);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? previousTask : t)));
      removeLingeringTask(task.id);
      window.alert(message);
    }
  };

  const visibleTasks = useMemo(() => {
    if (hideCompleted) return tasks.filter((task) => task.status !== "done");
    const active = tasks.filter((t) => t.status !== "done");
    const done = tasks.filter((t) => t.status === "done");
    return [...active, ...done];
  }, [hideCompleted, tasks]);

  const renderedTasks = useMemo(() => {
    const currentTaskIds = new Set(visibleTasks.map((task) => task.id));
    const result = [...visibleTasks];
    const lingering = Object.values(lingeringCompletedTasks)
      .filter(({ task }) => !currentTaskIds.has(task.id))
      .sort((a, b) => a.index - b.index);

    lingering.forEach(({ task, index }) => {
      const insertionIndex = Math.max(0, Math.min(index, result.length));
      result.splice(insertionIndex, 0, task);
    });

    return result;
  }, [visibleTasks, lingeringCompletedTasks]);

  // ── Drag-to-reorder ───────────────────────────────────────────────────
  const [draggingId, setDraggingId] = useState<string | null>(null);
  // dropIndex: 0..renderedTasks.length — insert BEFORE this index (length = append to end)
  const [dropIndex, setDropIndex] = useState<number>(0);

  const dropIndexRef = useRef<number>(0);
  const holdTimerRef = useRef<number | null>(null);
  const pendingDragRef = useRef<{ taskId: string; startY: number } | null>(null);
  const itemRefsMap = useRef<Map<string, HTMLDivElement>>(new Map());

  // Always-current refs so the pointer-event effect never captures stale data
  const renderedTasksRef = useRef(renderedTasks);
  renderedTasksRef.current = renderedTasks;
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  const getItemRef = (taskId: string) => (el: HTMLDivElement | null) => {
    if (el) itemRefsMap.current.set(taskId, el);
    else itemRefsMap.current.delete(taskId);
  };

  const calcDropIndex = (mouseY: number): number => {
    const list = renderedTasksRef.current;
    for (let i = 0; i < list.length; i++) {
      const rect = itemRefsMap.current.get(list[i]!.id)?.getBoundingClientRect();
      if (!rect) continue;
      if (mouseY < rect.top + rect.height / 2) return i;
    }
    return list.length;
  };

  const cancelHold = () => {
    if (holdTimerRef.current !== null) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    pendingDragRef.current = null;
  };

  const handlePointerDown = (taskId: string, y: number) => {
    cancelHold();
    pendingDragRef.current = { taskId, startY: y };
    const fromIdx = renderedTasksRef.current.findIndex((t) => t.id === taskId);
    holdTimerRef.current = window.setTimeout(() => {
      holdTimerRef.current = null;
      pendingDragRef.current = null;
      const initDrop = fromIdx >= 0 ? fromIdx : 0;
      dropIndexRef.current = initDrop;
      setDropIndex(initDrop);
      setDraggingId(taskId);
    }, HOLD_MS);
  };

  // Pointer-move on the container before drag activates (to cancel hold on scroll)
  const handleContainerPointerMove = (e: React.PointerEvent) => {
    if (!pendingDragRef.current) return;
    if (Math.abs(e.clientY - pendingDragRef.current.startY) > 8) {
      cancelHold();
    }
  };

  // Document-level listeners active only while dragging
  useEffect(() => {
    if (!draggingId) return;

    const handleMove = (e: PointerEvent) => {
      const idx = calcDropIndex(e.clientY);
      dropIndexRef.current = idx;
      setDropIndex(idx);
    };

    const handleUp = async () => {
      const taskId = draggingId;
      const currentDrop = dropIndexRef.current;
      setDraggingId(null);

      const list = renderedTasksRef.current;
      const fromIndex = list.findIndex((t) => t.id === taskId);
      if (fromIndex === -1) return;

      // No-op: dropped on same position
      if (currentDrop === fromIndex || currentDrop === fromIndex + 1) return;

      // Compute afterId from the others array (list without the dragged task)
      const others = list.filter((t) => t.id !== taskId);
      const insertInOthers = currentDrop > fromIndex ? currentDrop - 1 : currentDrop;
      const afterId = insertInOthers === 0 ? null : (others[insertInOthers - 1]?.id ?? null);

      // Optimistic update: reorder in the atom
      const snapshot = tasksRef.current;
      setTasks((prev) => {
        const arr = [...prev];
        const from = arr.findIndex((t) => t.id === taskId);
        if (from === -1) return prev;
        const [moved] = arr.splice(from, 1);
        if (!moved) return prev;
        if (afterId === null) {
          // Insert before the first sibling in the full array
          const firstSiblingIdx = arr.findIndex((t) =>
            renderedTasksRef.current.some((v) => v.id === t.id),
          );
          arr.splice(firstSiblingIdx >= 0 ? firstSiblingIdx : 0, 0, moved);
        } else {
          const afterIdx = arr.findIndex((t) => t.id === afterId);
          arr.splice(afterIdx >= 0 ? afterIdx + 1 : arr.length, 0, moved);
        }
        return arr;
      });

      try {
        const updated = await api.tasks.move(taskId, afterId);
        setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      } catch {
        // Revert on failure
        setTasks(snapshot);
      }
    };

    document.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerup", handleUp);
    document.addEventListener("pointercancel", handleUp);
    return () => {
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerup", handleUp);
      document.removeEventListener("pointercancel", handleUp);
    };
  }, [draggingId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render ────────────────────────────────────────────────────────────
  const dropLine = (
    <Box
      style={{
        height: 2,
        borderRadius: 1,
        background: "var(--mantine-color-blue-5)",
        margin: "0 4px",
        position: "relative",
        zIndex: 1,
      }}
    />
  );

  return (
    <Stack gap={0} onPointerMove={handleContainerPointerMove} onPointerUp={cancelHold}>
      {renderedTasks.length === 0 && emptyMessage && (
        <Text size="sm" c="dimmed" mb="md">
          {emptyMessage}
        </Text>
      )}
      {draggingId && dropIndex === 0 && dropLine}
      {renderedTasks.map((task, i) => (
        <div key={task.id} ref={getItemRef(task.id)}>
          <TaskItem
            appearance={appearance}
            isListItem={isList}
            task={task}
            isLast={i === renderedTasks.length - 1}
            isActive={isList || active ? true : false}
            isDragging={task.id === draggingId}
            todayView={todayView}
            showContext={showContext}
            handleClick={(e) => {
              if (draggingId) return;
              e.stopPropagation();
              setSelectedTaskId(task.id);
            }}
            handleToggleComplete={handleToggleComplete(task)}
            onPointerDown={(e) => {
              e.stopPropagation();
              handlePointerDown(task.id, e.clientY);
            }}
          />
          {draggingId && dropIndex === i + 1 && dropLine}
        </div>
      ))}
      {showNewTaskInput ? (
        <Box mt="sm">
          <NewTaskInput projectId={projectId} areaId={areaId} />
        </Box>
      ) : null}
    </Stack>
  );
}
