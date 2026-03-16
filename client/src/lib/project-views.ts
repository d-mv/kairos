import type { ProjectDTO } from "@kairos/shared";

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
