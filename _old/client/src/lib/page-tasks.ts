type TaskListParams = {
  projectId?: string;
  areaId?: string;
  inbox?: boolean;
  parentTaskId?: string;
};

export type PageTaskScope =
  | { kind: "inbox" }
  | { kind: "project"; id: string }
  | { kind: "area"; id: string }
  | { kind: "today" | "upcoming" | "schedule" | "projects" | "search" | "completed" };

export function getPageTaskScopeKey(scope: PageTaskScope | null): string {
  if (!scope) {
    return "";
  }

  switch (scope.kind) {
    case "project":
    case "area":
      return `${scope.kind}:${scope.id}`;
    default:
      return scope.kind;
  }
}

export function getPageTaskListParams(scope: PageTaskScope): TaskListParams | undefined {
  switch (scope.kind) {
    case "inbox":
      return { inbox: true };
    case "project":
      return { projectId: scope.id };
    case "area":
      return { areaId: scope.id };
    default:
      return undefined;
  }
}
