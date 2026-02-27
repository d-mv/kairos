import { atom } from "jotai";
import type { TaskDTO } from "@kairos/shared";

export const tasksAtom = atom<TaskDTO[]>([]);

export const inboxTasksAtom = atom((get) =>
  get(tasksAtom).filter(
    (t) => t.parentTaskId === null && t.projectId === null && t.areaId === null,
  ),
);

export const tasksByProjectAtom = atom((get) => {
  const tasks = get(tasksAtom);
  const map = new Map<string, TaskDTO[]>();
  for (const t of tasks) {
    if (!t.projectId || t.parentTaskId) continue;
    const existing = map.get(t.projectId) ?? [];
    existing.push(t);
    map.set(t.projectId, existing);
  }
  return map;
});

export const tasksByAreaAtom = atom((get) => {
  const tasks = get(tasksAtom);
  const map = new Map<string, TaskDTO[]>();
  for (const t of tasks) {
    if (!t.areaId) continue;
    const existing = map.get(t.areaId) ?? [];
    existing.push(t);
    map.set(t.areaId, existing);
  }
  return map;
});

export const subtasksByParentAtom = atom((get) => {
  const tasks = get(tasksAtom);
  const map = new Map<string, TaskDTO[]>();
  for (const t of tasks) {
    if (!t.parentTaskId) continue;
    const existing = map.get(t.parentTaskId) ?? [];
    existing.push(t);
    map.set(t.parentTaskId, existing);
  }
  return map;
});

// Selected task for the detail panel
export const selectedTaskIdAtom = atom<string | null>(null);
export const selectedTaskAtom = atom((get) => {
  const id = get(selectedTaskIdAtom);
  if (!id) return null;
  return get(tasksAtom).find((t) => t.id === id) ?? null;
});
