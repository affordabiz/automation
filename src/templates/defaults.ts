import type { TemplateCopy } from "./types";
import { T1_DEFAULT_COPY } from "./t1/defaultCopy";
import { T2_DEFAULT_COPY } from "./t2/defaultCopy";

export const DEFAULT_COPY: Partial<Record<number, TemplateCopy>> = { 1: T1_DEFAULT_COPY, 2: T2_DEFAULT_COPY };

export function getDefaultCopy(n: number): TemplateCopy | null {
  return DEFAULT_COPY[n] ?? null;
}
