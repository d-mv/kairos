import type { AreaDTO, BrainPageDTO, ProjectDTO, TaskDTO } from "@kairos/shared";

export type SearchResultKind = "task" | "project" | "area" | "brain_page";

export interface SearchResult {
  id: string;
  kind: SearchResultKind;
  label: string;
  route: string;
  subtitle: string;
}

export interface SearchWorkspaceInput {
  tasks: TaskDTO[];
  projects: ProjectDTO[];
  areas: AreaDTO[];
  brainPages: BrainPageDTO[];
}

function includesQuery(value: string | null | undefined, query: string): boolean {
  return value?.toLocaleLowerCase().includes(query) ?? false;
}

export function searchWorkspace(
  rawQuery: string,
  { tasks, projects, areas, brainPages }: SearchWorkspaceInput,
): SearchResult[] {
  const query = rawQuery.trim().toLocaleLowerCase();
  if (!query) return [];

  return [
    ...tasks
      .filter(
        (task) =>
          includesQuery(task.title, query) ||
          includesQuery(task.description, query) ||
          task.tags.some((tag) => includesQuery(tag, query)),
      )
      .map((task) => ({
        id: task.id,
        kind: "task" as const,
        label: task.title,
        route: task.projectId
          ? `/project/${task.projectId}`
          : task.areaId
            ? `/area/${task.areaId}`
            : task.status === "done"
              ? "/completed"
              : "/inbox",
        subtitle: "Task",
      })),
    ...projects
      .filter((project) => includesQuery(project.name, query))
      .map((project) => ({
        id: project.id,
        kind: "project" as const,
        label: project.name,
        route: `/project/${project.id}`,
        subtitle: "Project",
      })),
    ...areas
      .filter((area) => includesQuery(area.name, query))
      .map((area) => ({
        id: area.id,
        kind: "area" as const,
        label: area.name,
        route: `/area/${area.id}`,
        subtitle: "Area",
      })),
    ...brainPages
      .filter((page) => includesQuery(page.title, query))
      .map((page) => ({
        id: page.id,
        kind: "brain_page" as const,
        label: page.title,
        route: `/brain/page/${page.id}`,
        subtitle: "Brain page",
      })),
  ];
}
