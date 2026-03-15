import { useEffect } from "react";
import { useSetAtom, useAtomValue } from "jotai";
import { areasAtom } from "../atoms/areas.js";
import { brainFoldersAtom, brainPagesAtom } from "../atoms/brain.js";
import { projectsAtom } from "../atoms/projects.js";
import { tasksAtom } from "../atoms/tasks.js";
import {
  workspaceErrorAtom,
  workspaceLoadingAtom,
  workspaceReadyAtom,
  workspaceReloadAtom,
} from "../atoms/workspace.js";
import { lastWsEventAtom } from "../atoms/ws.js";
import { api } from "../lib/api.js";
import { loadWorkspaceCache, saveWorkspaceCache } from "../lib/cache.js";

/**
 * Loads initial data and applies WebSocket patches.
 * Used once in the top-level AppLayout.
 */
export function useDataSync() {
  const setAreas = useSetAtom(areasAtom);
  const setBrainFolders = useSetAtom(brainFoldersAtom);
  const setBrainPages = useSetAtom(brainPagesAtom);
  const setProjects = useSetAtom(projectsAtom);
  const setTasks = useSetAtom(tasksAtom);
  const setWorkspaceError = useSetAtom(workspaceErrorAtom);
  const setWorkspaceLoading = useSetAtom(workspaceLoadingAtom);
  const setWorkspaceReady = useSetAtom(workspaceReadyAtom);
  const reloadTick = useAtomValue(workspaceReloadAtom);
  const lastEvent = useAtomValue(lastWsEventAtom);

  useEffect(() => {
    let cancelled = false;

    const loadWorkspace = async () => {
      setWorkspaceLoading(true);
      setWorkspaceReady(false);
      setWorkspaceError(null);

      // Hydrate from cache immediately so UI is responsive before the API responds
      const cached = loadWorkspaceCache();
      if (cached && !cancelled) {
        setAreas(cached.areas);
        setBrainFolders(cached.brainFolders);
        setBrainPages(cached.brainPages);
        setProjects(cached.projects);
        setTasks(cached.tasks);
        setWorkspaceReady(true);
        setWorkspaceLoading(false);
      }

      try {
        const [areas, brain, projects, tasks] = await Promise.all([
          api.areas.list(),
          api.brain.list(),
          api.projects.list(),
          api.tasks.list(),
        ]);

        if (cancelled) return;

        setAreas(areas);
        setBrainFolders(brain.folders);
        setBrainPages(brain.pages);
        setProjects(projects);
        setTasks(tasks);
        setWorkspaceReady(true);
        saveWorkspaceCache({
          areas,
          brainFolders: brain.folders,
          brainPages: brain.pages,
          projects,
          tasks,
        });
      } catch (error) {
        if (!cancelled) {
          console.error(error);
          // If we already hydrated from cache, don't show an error
          if (!cached) {
            setWorkspaceError(error instanceof Error ? error.message : "Failed to load workspace");
          }
        }
      } finally {
        if (!cancelled) {
          setWorkspaceLoading(false);
        }
      }
    };

    void loadWorkspace();

    return () => {
      cancelled = true;
    };
  }, [
    reloadTick,
    setAreas,
    setBrainFolders,
    setBrainPages,
    setProjects,
    setTasks,
    setWorkspaceError,
    setWorkspaceLoading,
    setWorkspaceReady,
  ]);

  useEffect(() => {
    const poll = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const [areas, brain, projects, tasks] = await Promise.all([
          api.areas.list(),
          api.brain.list(),
          api.projects.list(),
          api.tasks.list(),
        ]);
        setAreas(areas);
        setBrainFolders(brain.folders);
        setBrainPages(brain.pages);
        setProjects(projects);
        setTasks(tasks);
        saveWorkspaceCache({
          areas,
          brainFolders: brain.folders,
          brainPages: brain.pages,
          projects,
          tasks,
        });
      } catch {
        // silent — don't surface polling errors
      }
    };

    const id = window.setInterval(() => void poll(), 30_000);
    return () => window.clearInterval(id);
  }, [setAreas, setBrainFolders, setBrainPages, setProjects, setTasks]);

  useEffect(() => {
    if (!lastEvent) return;

    switch (lastEvent.type) {
      case "task:created":
        setTasks((prev) => {
          if (prev.some((t) => t.id === lastEvent.payload.id)) return prev;
          return [...prev, lastEvent.payload];
        });
        break;
      case "task:updated":
        setTasks((prev) =>
          prev.map((t) => (t.id === lastEvent.payload.id ? lastEvent.payload : t)),
        );
        break;
      case "task:deleted":
        setTasks((prev) => prev.filter((t) => t.id !== lastEvent.payload.id));
        break;

      case "project:created":
        setProjects((prev) => {
          if (prev.some((p) => p.id === lastEvent.payload.id)) return prev;
          return [...prev, lastEvent.payload];
        });
        break;
      case "project:updated":
        setProjects((prev) =>
          prev.map((p) => (p.id === lastEvent.payload.id ? lastEvent.payload : p)),
        );
        break;
      case "project:deleted":
        setProjects((prev) => prev.filter((p) => p.id !== lastEvent.payload.id));
        break;

      case "area:created":
        setAreas((prev) => {
          if (prev.some((a) => a.id === lastEvent.payload.id)) return prev;
          return [...prev, lastEvent.payload];
        });
        break;
      case "area:updated":
        setAreas((prev) =>
          prev.map((a) => (a.id === lastEvent.payload.id ? lastEvent.payload : a)),
        );
        break;
      case "area:deleted":
        setAreas((prev) => prev.filter((a) => a.id !== lastEvent.payload.id));
        break;
    }
  }, [lastEvent, setAreas, setProjects, setTasks]);
}
