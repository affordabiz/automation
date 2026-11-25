import type { TemplateCopy } from "./types";
import { T1_DEFAULT_COPY } from "./t1/defaultCopy";
import { T2_DEFAULT_COPY } from "./t2/defaultCopy";
import { T3_DEFAULT_COPY } from "./t3/defaultCopy";
import { T4_DEFAULT_COPY } from "./t4/defaultCopy";

export const DEFAULT_COPY: Partial<Record<number, TemplateCopy>> = {
  1: T1_DEFAULT_COPY,
  2: T2_DEFAULT_COPY,
  3: T3_DEFAULT_COPY,
  4: T4_DEFAULT_COPY,
};

export function getDefaultCopy(n: number): TemplateCopy | null {
  return DEFAULT_COPY[n] ?? null;
}
