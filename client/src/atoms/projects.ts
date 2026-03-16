import { atom } from "jotai";
import type { ProjectDTO } from "@kairos/shared";
import { getActiveProjects, getCompletedProjects } from "../lib/project-views.js";

export const projectsAtom = atom<ProjectDTO[]>([]);

export const activeProjectsAtom = atom((get) => getActiveProjects(get(projectsAtom)));

export const completedProjectsAtom = atom((get) => getCompletedProjects(get(projectsAtom)));

export const projectsByAreaAtom = atom((get) => {
  const projects = get(activeProjectsAtom);
  const map = new Map<string | null, ProjectDTO[]>();
  for (const p of projects) {
    const key = p.areaId;
    const existing = map.get(key) ?? [];
    existing.push(p);
    map.set(key, existing);
  }
  return map;
});
