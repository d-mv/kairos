import type { TaskDTO } from "@kairos/shared";

function toDateKey(value: string): string {
  return value.slice(0, 10);
}

function compareDueDates(left: TaskDTO, right: TaskDTO): number {
  if (!left.dueDate || !right.dueDate) return 0;
  return left.dueDate.localeCompare(right.dueDate);
}

function isOpenDatedTask(task: TaskDTO): task is TaskDTO & { dueDate: string } {
  return task.status !== "done" && task.dueDate !== null;
}

export function getTodayTasks(tasks: TaskDTO[], today = new Date().toISOString()): TaskDTO[] {
  const todayKey = toDateKey(today);

  return tasks
    .filter(isOpenDatedTask)
    .filter((task) => task.dueDate <= todayKey)
    .sort(compareDueDates);
}

export function getUpcomingTasks(tasks: TaskDTO[], today = new Date().toISOString()): TaskDTO[] {
  const todayKey = toDateKey(today);

  return tasks
    .filter(isOpenDatedTask)
    .filter((task) => task.dueDate >= todayKey)
    .sort(compareDueDates);
}
