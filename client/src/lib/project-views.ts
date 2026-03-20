import type { ProjectDTO, TaskDTO } from "@kairos/shared";

export type ProjectListItem = {
  project: ProjectDTO;
  openTaskCount: number;
  highestPriority: number | null;
};

export function getActiveProjects(projects: ProjectDTO[]): ProjectDTO[] {
  return projects.filter((project) => project.completedAt == null);
}

export function getCompletedProjects(projects: ProjectDTO[]): ProjectDTO[] {
  return projects
    .filter((project) => project.completedAt != null)
    .sort((left, right) => {
      const leftTime = left.completedAt ? Date.parse(left.completedAt) : 0;
      const rightTime = right.completedAt ? Date.parse(right.completedAt) : 0;
      return rightTime - leftTime;
    });
}

export function getProjectListItems(projects: ProjectDTO[], tasks: TaskDTO[]): ProjectListItem[] {
  return projects.map((project) => {
    const openTasks = tasks.filter(
      (task) => task.projectId === project.id && task.status !== "done",
    );
    const highestPriority =
      openTasks.length > 0
        ? openTasks.reduce((best, task) => Math.min(best, task.priority), 4)
        : null;

    return {
      project,
      openTaskCount: openTasks.length,
      highestPriority,
    };
  });
}
