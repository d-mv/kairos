import type { AreaDTO, BrainFolderDTO, BrainPageDTO, ProjectDTO, TaskDTO } from "@kairos/shared";

const KEY = "kairos:workspace";

interface WorkspaceCache {
  areas: AreaDTO[];
  brainFolders: BrainFolderDTO[];
  brainPages: BrainPageDTO[];
  projects: ProjectDTO[];
  tasks: TaskDTO[];
}

export function loadWorkspaceCache(): WorkspaceCache | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<WorkspaceCache>;
    return {
      areas: parsed.areas ?? [],
      brainFolders: parsed.brainFolders ?? [],
      brainPages: parsed.brainPages ?? [],
      projects: parsed.projects ?? [],
      tasks: parsed.tasks ?? [],
    };
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
