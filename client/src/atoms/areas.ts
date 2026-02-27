import { atom } from 'jotai';
import type { AreaDTO } from '@kairos/shared';

export const areasAtom = atom<AreaDTO[]>([]);

export const areasLoadingAtom = atom<boolean>(false);
