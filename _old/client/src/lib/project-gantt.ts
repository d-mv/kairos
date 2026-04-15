import type { TaskDTO, TaskDurationUnit } from "@kairos/shared";
import { addDays, differenceInCalendarDays, formatISO, subDays } from "date-fns";

export type ProjectGanttItem = {
  task: TaskDTO;
  startDate: string;
  endDate: string;
  startOffsetDays: number;
  spanDays: number;
};

export type ProjectGanttData = {
  columns: string[];
  items: ProjectGanttItem[];
};

function toIsoDate(value: Date) {
  return formatISO(value, { representation: "date" });
}

export function getTaskSpanDays(duration: number | null, unit: TaskDurationUnit | null) {
  if (!duration || !unit) return 1;
  if (unit === "h") return 1;
  if (unit === "d") return duration;
  if (unit === "w") return duration * 7;
  return duration * 30;
}

export function canShowProjectGantt(tasks: TaskDTO[]) {
  return tasks.some((task) => task.dueDate !== null);
}

export function getProjectGanttData(tasks: TaskDTO[]): ProjectGanttData {
  const datedItems = tasks
    .filter((task): task is TaskDTO & { dueDate: string } => task.dueDate !== null)
    .map((task) => {
      const end = new Date(task.dueDate);
      const spanDays = getTaskSpanDays(task.duration, task.durationUnit);
      const start = subDays(end, spanDays - 1);

      return {
        task,
        start,
        end,
        startDate: toIsoDate(start),
        endDate: toIsoDate(end),
        spanDays,
      };
    });

  if (datedItems.length === 0) {
    return { columns: [], items: [] };
  }

  const rangeStart = datedItems.reduce(
    (min, item) => (item.start < min ? item.start : min),
    datedItems[0]!.start,
  );
  const rangeEnd = datedItems.reduce(
    (max, item) => (item.end > max ? item.end : max),
    datedItems[0]!.end,
  );
  const totalDays = differenceInCalendarDays(rangeEnd, rangeStart) + 1;
  const columns = Array.from({ length: totalDays }, (_, index) =>
    toIsoDate(addDays(rangeStart, index)),
  );

  return {
    columns,
    items: datedItems.map((item) => ({
      task: item.task,
      startDate: item.startDate,
      endDate: item.endDate,
      startOffsetDays: differenceInCalendarDays(item.start, rangeStart),
      spanDays: item.spanDays,
    })),
  };
}
