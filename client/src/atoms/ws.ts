import { atom } from "jotai";
import type { WsEvent } from "@kairos/shared";

/**
 * The last WebSocket event received. Consumers watch this atom and apply patches
 * to tasks/projects/areas atoms as needed.
 */
export const lastWsEventAtom = atom<WsEvent | null>(null);
