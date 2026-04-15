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

export interface SearchWorkspaceOptions {
  showCompleted?: boolean;
}

function includesQuery(value: string | null | undefined, query: string): boolean {
  return value?.toLocaleLowerCase().includes(query) ?? false;
}

function buildSubtitle(kind: string, labels: Array<string | null | undefined>): string {
  const context = labels.filter((label): label is string => Boolean(label));
  return [kind, ...context].join(" - ");
}

export function searchWorkspace(
  rawQuery: string,
  { tasks, projects, areas, brainPages }: SearchWorkspaceInput,
  { showCompleted = false }: SearchWorkspaceOptions = {},
): SearchResult[] {
  const query = rawQuery.trim().toLocaleLowerCase();
  if (!query) return [];
  const projectsById = new Map(projects.map((project) => [project.id, project]));
  const areasById = new Map(areas.map((area) => [area.id, area]));
  const taskResults = tasks
    .filter(
      (task) =>
        (showCompleted || task.status !== "done") &&
        (includesQuery(task.title, query) ||
          includesQuery(task.description, query) ||
          task.tags.some((tag) => includesQuery(tag, query))),
    )
    .sort((left, right) => left.priority - right.priority)
    .map((task) => {
      const project = task.projectId ? projectsById.get(task.projectId) : undefined;
      const area =
        (project?.areaId ? areasById.get(project.areaId) : undefined) ??
        (task.areaId ? areasById.get(task.areaId) : undefined);

      return {
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
        subtitle: buildSubtitle("Task", [area?.name, project?.name]),
      };
    });

  return [
    ...taskResults,
    ...projects
      .filter((project) => includesQuery(project.name, query))
      .map((project) => {
        const area = project.areaId ? areasById.get(project.areaId) : undefined;

        return {
          id: project.id,
          kind: "project" as const,
          label: project.name,
          route: `/project/${project.id}`,
          subtitle: buildSubtitle("Project", [area?.name]),
        };
      }),
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
