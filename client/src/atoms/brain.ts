import { atom } from "jotai";
import type { BrainFolderDTO, BrainPageDTO } from "@kairos/shared";

export const brainFoldersAtom = atom<BrainFolderDTO[]>([]);
export const brainPagesAtom = atom<BrainPageDTO[]>([]);

export const sortedBrainFoldersAtom = atom((get) =>
  [...get(brainFoldersAtom)].sort((left, right) => left.name.localeCompare(right.name)),
);

export const rootBrainPagesAtom = atom((get) =>
  get(brainPagesAtom)
    .filter((page) => page.folderId === null)
    .sort((left, right) => left.title.localeCompare(right.title)),
);

export const brainPagesByFolderAtom = atom((get) => {
  const map = new Map<string, BrainPageDTO[]>();
  for (const page of get(brainPagesAtom)) {
    if (!page.folderId) continue;
    const existing = map.get(page.folderId) ?? [];
    existing.push(page);
    map.set(page.folderId, existing);
  }
  for (const [folderId, pages] of map.entries()) {
    map.set(
      folderId,
      [...pages].sort((left, right) => left.title.localeCompare(right.title)),
    );
  }
  return map;
});
