export type TemplateStatus = "live" | "coming-soon";

export interface TemplateMeta {
  number: number;
  name: string;
  status: TemplateStatus;
  swatch: readonly [string, string];
}

export const TEMPLATE_CATALOG: readonly TemplateMeta[] = [
  { number: 1, name: "Classic Tax Pro", status: "live", swatch: ["#0E5A4E", "#F7931E"] },
  { number: 2, name: "Template 2", status: "coming-soon", swatch: ["#1E293B", "#64748B"] },
  { number: 3, name: "Template 3", status: "coming-soon", swatch: ["#1E293B", "#64748B"] },
  { number: 4, name: "Template 4", status: "coming-soon", swatch: ["#1E293B", "#64748B"] },
  { number: 5, name: "Template 5", status: "coming-soon", swatch: ["#1E293B", "#64748B"] },
  { number: 6, name: "Template 6", status: "coming-soon", swatch: ["#1E293B", "#64748B"] },
  { number: 7, name: "Template 7", status: "coming-soon", swatch: ["#1E293B", "#64748B"] },
];

export function getTemplateMeta(n: number): TemplateMeta | undefined {
  return TEMPLATE_CATALOG.find((t) => t.number === n);
}

export function isLiveTemplate(n: number): boolean {
  return getTemplateMeta(n)?.status === "live";
}
