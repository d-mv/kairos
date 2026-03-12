import { atom } from "jotai";

export type PageMenuItem = {
  label: string;
  color?: string;
  disabled?: boolean;
  onClick: () => void;
};

export const pageMenuAtom = atom<PageMenuItem[]>([]);
