import type { NotificationDTO } from "@kairos/shared";
import { atom } from "jotai";

export const notificationsAtom = atom<NotificationDTO[]>([]);
