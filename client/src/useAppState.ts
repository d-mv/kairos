import { useAtomValue } from "jotai";
import { useEffect } from "react";
import { areasAtom } from "./atoms/areas.js";
import { projectsAtom } from "./atoms/projects.js";
import { renameEntityAtom } from "./atoms/renameEntity.atom.js";
import { tasksAtom } from "./atoms/tasks.js";
import {
  workspaceErrorAtom,
  workspaceLoadingAtom,
  workspaceReadyAtom,
  workspaceReloadAtom,
} from "./atoms/workspace.js";

export function useAppState() {
  const areas = useAtomValue(areasAtom);
  const projects = useAtomValue(projectsAtom);
  const tasks = useAtomValue(tasksAtom);
  const renameEntityState = useAtomValue(renameEntityAtom);
  const workspaceLoading = useAtomValue(workspaceLoadingAtom);
  const workspaceReady = useAtomValue(workspaceReadyAtom);
  const workspaceError = useAtomValue(workspaceErrorAtom);
  const workspaceReload = useAtomValue(workspaceReloadAtom);

  useEffect(() => {
    console.log({
      areas,
      projects,
      tasks,
      renameEntityState,
      workspaceLoading,
      workspaceReady,
      workspaceError,
      workspaceReload,
    });
  }, [
    workspaceReload,
    areas,
    projects,
    tasks,
    renameEntityState,
    workspaceLoading,
    workspaceReady,
    workspaceError,
  ]);
}
