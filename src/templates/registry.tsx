import type { ComponentType } from "react";
import type { TemplateProps } from "./types";
import TemplateOne from "./t1";

const COMPONENTS: Partial<Record<number, ComponentType<TemplateProps>>> = { 1: TemplateOne };

export function getTemplateComponent(n: number): ComponentType<TemplateProps> | null {
  return COMPONENTS[n] ?? null;
}
