import type { TaskDTO } from "@kairos/shared";
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  formatISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";

export type TaskCalendarDay = {
  date: string;
  inMonth: boolean;
  tasks: TaskDTO[];
};

export type TaskCalendarData = {
  monthLabel: string;
  weeks: TaskCalendarDay[][];
};

function toIsoDate(value: Date) {
  return formatISO(value, { representation: "date" });
}

export function getTaskCalendarData(
  tasks: TaskDTO[],
  anchorDate?: string,
): TaskCalendarData | null {
  const datedTasks = tasks
    .filter((task): task is TaskDTO & { dueDate: string } => task.dueDate !== null)
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate));

  if (datedTasks.length === 0) {
    return null;
  }

  const anchor = anchorDate ? new Date(anchorDate) : new Date(datedTasks[0]!.dueDate);
  const monthStart = startOfMonth(anchor);
  const monthEnd = endOfMonth(anchor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const taskMap = new Map<string, TaskDTO[]>();

  for (const task of datedTasks) {
    const key = task.dueDate;
    const existing = taskMap.get(key) ?? [];
    existing.push(task);
    taskMap.set(key, existing);
  }

  const days = eachDayOfInterval({ start: gridStart, end: gridEnd }).map((day) => {
    const key = toIsoDate(day);
    return {
      date: key,
      inMonth: day >= monthStart && day <= monthEnd,
      tasks: taskMap.get(key) ?? [],
    };
  });

  const weeks: TaskCalendarDay[][] = [];
  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }

  return {
    monthLabel: toIsoDate(monthStart),
    weeks,
  };
}

export function getNextTaskCalendarMonth(monthLabel: string) {
  return toIsoDate(startOfMonth(addDays(new Date(monthLabel), 32)));
}

export function getPreviousTaskCalendarMonth(monthLabel: string) {
  return toIsoDate(startOfMonth(addDays(new Date(monthLabel), -1)));
}
