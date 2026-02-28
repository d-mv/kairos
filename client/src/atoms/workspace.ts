import { atom } from "jotai";

export const workspaceLoadingAtom = atom<boolean>(false);
export const workspaceReadyAtom = atom<boolean>(false);
export const workspaceErrorAtom = atom<string | null>(null);
export const workspaceReloadAtom = atom<number>(0);
