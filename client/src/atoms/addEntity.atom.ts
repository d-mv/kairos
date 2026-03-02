import { EntityType } from "@kairos/shared";
import { atom } from "jotai";

export type AddEntityType = {
  entityLabel: string;
  type: EntityType;
  errorMessage?: string | null;
  loading?: boolean | null;
};

export const addEntityAtom = atom<AddEntityType | null>(null);
