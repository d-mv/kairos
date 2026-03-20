import { atom } from "jotai";

export type PageMenuItem = {
  label: string;
  section?: string;
  shortcut?: string;
  selected?: boolean;
  color?: string;
  disabled?: boolean;
  onClick: () => void;
};

export const pageMenuAtom = atom<PageMenuItem[]>([]);
