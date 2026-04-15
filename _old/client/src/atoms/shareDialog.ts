import type { ShareEntityType } from "@kairos/shared";
import { atom } from "jotai";

export type ShareDialogState = {
  entityType: ShareEntityType;
  entityId: string;
  entityLabel: string;
} | null;

export const shareDialogAtom = atom<ShareDialogState>(null);
