import { validateMaps } from './validate.ts';
import { coastal } from './coastal.ts';
import { forest } from './forest.ts';
export type { RaceMap } from './types';
export const raceMaps=validateMaps([coastal,forest]);
export function getRaceMap(id:string|null){return raceMaps.find(map=>map.id===id)??coastal;}
