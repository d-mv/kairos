import { useEffect } from "react";
import { useSetAtom, useAtomValue } from "jotai";
import { areasAtom } from "../atoms/areas.js";
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

/**
 * Loads initial data and applies WebSocket patches.
 * Used once in the top-level AppLayout.
 */
export function useDataSync() {
  const setAreas = useSetAtom(areasAtom);
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

      try {
        const [areas, projects, tasks] = await Promise.all([
          api.areas.list(),
          api.projects.list(),
          api.tasks.list(),
        ]);

        if (cancelled) return;

        setAreas(areas);
        setProjects(projects);
        setTasks(tasks);
        setWorkspaceReady(true);
      } catch (error) {
        if (!cancelled) {
          console.error(error);
          setWorkspaceError(error instanceof Error ? error.message : "Failed to load workspace");
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
    setProjects,
    setTasks,
    setWorkspaceError,
    setWorkspaceLoading,
    setWorkspaceReady,
  ]);

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
