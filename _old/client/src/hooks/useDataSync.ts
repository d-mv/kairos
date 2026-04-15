import { useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";
import { areasAtom } from "../atoms/areas.js";
import { brainFoldersAtom, brainPagesAtom } from "../atoms/brain.js";
import { notificationsAtom } from "../atoms/notifications.js";
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
 * Loads initial shell data and applies WebSocket patches.
 * Used once in the top-level AppLayout.
 */
export function useDataSync() {
  const setAreas = useSetAtom(areasAtom);
  const setBrainFolders = useSetAtom(brainFoldersAtom);
  const setBrainPages = useSetAtom(brainPagesAtom);
  const setNotifications = useSetAtom(notificationsAtom);
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

      const cached = loadWorkspaceCache();
      if (cached && !cancelled) {
        setAreas(cached.areas);
        setBrainFolders(cached.brainFolders);
        setBrainPages(cached.brainPages);
        setProjects(cached.projects);
        setWorkspaceReady(true);
        setWorkspaceLoading(false);
      }

      try {
        const [areas, brain, notifications, projects] = await Promise.all([
          api.areas.list(),
          api.brain.list(),
          api.notifications.list(),
          api.projects.list(),
        ]);

        if (cancelled) return;

        setAreas(areas);
        setBrainFolders(brain.folders);
        setBrainPages(brain.pages);
        setNotifications(notifications);
        setProjects(projects);
        setWorkspaceReady(true);
        saveWorkspaceCache({
          areas,
          brainFolders: brain.folders,
          brainPages: brain.pages,
          projects,
        });
      } catch (error) {
        if (!cancelled) {
          console.error(error);
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
    setNotifications,
    setProjects,
    setWorkspaceError,
    setWorkspaceLoading,
    setWorkspaceReady,
  ]);

  useEffect(() => {
    const poll = async () => {
      if (document.visibilityState !== "visible") return;

      try {
        const notifications = await api.notifications.list();
        if (document.visibilityState !== "visible") return;
        setNotifications(notifications);
      } catch {
        // silent — don't surface polling errors
      }
    };

    const id = window.setInterval(() => void poll(), 30_000);
    return () => window.clearInterval(id);
  }, [setNotifications]);

  useEffect(() => {
    if (!lastEvent) return;

    switch (lastEvent.type) {
      case "task:created":
        setTasks((prev) => {
          if (prev.some((task) => task.id === lastEvent.payload.id)) return prev;
          return [...prev, lastEvent.payload];
        });
        break;
      case "task:updated":
        setTasks((prev) =>
          prev.map((task) => (task.id === lastEvent.payload.id ? lastEvent.payload : task)),
        );
        break;
      case "task:deleted":
        setTasks((prev) => prev.filter((task) => task.id !== lastEvent.payload.id));
        break;
      case "project:created":
        setProjects((prev) => {
          if (prev.some((project) => project.id === lastEvent.payload.id)) return prev;
          return [...prev, lastEvent.payload];
        });
        break;
      case "project:updated":
        setProjects((prev) =>
          prev.map((project) =>
            project.id === lastEvent.payload.id ? lastEvent.payload : project,
          ),
        );
        break;
      case "project:deleted":
        setProjects((prev) => prev.filter((project) => project.id !== lastEvent.payload.id));
        break;
      case "area:created":
        setAreas((prev) => {
          if (prev.some((area) => area.id === lastEvent.payload.id)) return prev;
          return [...prev, lastEvent.payload];
        });
        break;
      case "area:updated":
        setAreas((prev) =>
          prev.map((area) => (area.id === lastEvent.payload.id ? lastEvent.payload : area)),
        );
        break;
      case "area:deleted":
        setAreas((prev) => prev.filter((area) => area.id !== lastEvent.payload.id));
        break;
      case "notification:created":
        setNotifications((prev) => {
          if (prev.some((notification) => notification.id === lastEvent.payload.id)) return prev;
          return [lastEvent.payload, ...prev];
        });
        break;
    }
  }, [lastEvent, setAreas, setNotifications, setProjects, setTasks]);
}
