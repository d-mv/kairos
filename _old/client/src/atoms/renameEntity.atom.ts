import { EntityType } from "@kairos/shared";
import { atom } from "jotai";

export type RenameEntityType = {
  entityLabel: string;
  entityId: string;
  currentName: string;
  type: EntityType;
  errorMessage?: string | null;
  loading?: boolean | null;
};

export const renameEntityAtom = atom<RenameEntityType | null>(null);
