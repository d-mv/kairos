import { atom } from "jotai";
import type { ProjectDTO } from "@kairos/shared";

export const projectsAtom = atom<ProjectDTO[]>([]);

export const projectsByAreaAtom = atom((get) => {
  const projects = get(projectsAtom);
  const map = new Map<string | null, ProjectDTO[]>();
  for (const p of projects) {
    const key = p.areaId;
    const existing = map.get(key) ?? [];
    existing.push(p);
    map.set(key, existing);
  }
  return map;
});
