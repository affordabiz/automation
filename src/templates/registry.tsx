import type { TemplateProps } from "./types";
import TemplateOne from "./t1";
import TemplateTwo from "./t2";

const IMPLEMENTED = new Set([1, 2]);

export function hasTemplateComponent(n: number): boolean {
  return IMPLEMENTED.has(n);
}

/** Renders the template for `templateNumber`. Add a case per new template. */
export function TemplateView({ templateNumber, ...props }: TemplateProps & { templateNumber: number }) {
  switch (templateNumber) {
    case 1:
      return <TemplateOne {...props} />;
    case 2:
      return <TemplateTwo {...props} />;
    default:
      return null;
  }
}
