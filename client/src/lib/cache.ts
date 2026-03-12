import type { AreaDTO, ProjectDTO, TaskDTO } from "@kairos/shared";

const KEY = "kairos:workspace";

interface WorkspaceCache {
  areas: AreaDTO[];
  projects: ProjectDTO[];
  tasks: TaskDTO[];
}

export function loadWorkspaceCache(): WorkspaceCache | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WorkspaceCache;
  } catch {
    return null;
  }
}

export function saveWorkspaceCache(data: WorkspaceCache): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // quota exceeded or private browsing — ignore
  }
}
