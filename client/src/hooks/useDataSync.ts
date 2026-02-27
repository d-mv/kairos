import { useEffect } from "react";
import { useSetAtom, useAtomValue } from "jotai";
import { areasAtom } from "../atoms/areas.js";
import { projectsAtom } from "../atoms/projects.js";
import { tasksAtom } from "../atoms/tasks.js";
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
  const lastEvent = useAtomValue(lastWsEventAtom);

  // Initial load
  useEffect(() => {
    api.areas.list().then(setAreas).catch(console.error);
    api.projects.list().then(setProjects).catch(console.error);
    api.tasks.list().then(setTasks).catch(console.error);
  }, [setAreas, setProjects, setTasks]);

  // Apply WebSocket patches
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
