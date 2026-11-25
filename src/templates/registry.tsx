import { visibleButtons } from "./shared/buttons";
import type { TemplateProps } from "./types";
import TemplateOne from "./t1";
import TemplateTwo from "./t2";
import TemplateThree from "./t3";
import TemplateFour from "./t4";
import TemplateFive from "./t5";
import TemplateSix from "./t6";
import TemplateSeven from "./t7";

const IMPLEMENTED = new Set([1, 2, 3, 4, 5, 6, 7]);

export function hasTemplateComponent(n: number): boolean {
  return IMPLEMENTED.has(n);
}

/** Renders the template for `templateNumber`. Add a case per new template. */
export function TemplateView({ templateNumber, site, copy }: TemplateProps & { templateNumber: number }) {
  // Hidden buttons are dropped here so they never reach the browser, on every template.
  const props = { site, copy: { ...copy, headerButtons: visibleButtons(copy.headerButtons) } };
  switch (templateNumber) {
    case 1:
      return <TemplateOne {...props} />;
    case 2:
      return <TemplateTwo {...props} />;
    case 3:
      return <TemplateThree {...props} />;
    case 4:
      return <TemplateFour {...props} />;
    case 5:
      return <TemplateFive {...props} />;
    case 6:
      return <TemplateSix {...props} />;
    case 7:
      return <TemplateSeven {...props} />;
    default:
      return null;
  }
}
