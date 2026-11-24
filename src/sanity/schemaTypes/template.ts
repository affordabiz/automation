import { defineField, defineType } from "sanity";

const str = (name: string, title?: string) => defineField({ name, title, type: "string" });
const txt = (name: string, title?: string, description?: string) =>
  defineField({ name, title, type: "text", rows: 4, description });
const strings = (name: string, title?: string) =>
  defineField({ name, title, type: "array", of: [{ type: "string" }] });
const links = (name: string, title?: string) =>
  defineField({ name, title, type: "array", of: [{ type: "linkItem" }] });

const TOKENS = "Tokens: {{fullName}} {{businessName}} {{email}} {{phone}} {{address}} {{servingArea}}";
const RICH = "Supports **bold**, [label](https://link) and lines starting with '- ' for bullets.";

export const template = defineType({
  name: "template",
  title: "Template",
  type: "document",
  fields: [
    defineField({ name: "number", type: "number", validation: (r) => r.required().integer().min(1).max(7) }),
    defineField({ name: "name", type: "string" }),
    defineField({
      name: "copy",
      title: "Fixed text",
      description: `Empty fields fall back to the built-in text. ${TOKENS}`,
      type: "object",
      options: { collapsible: true },
      fields: [
        links("nav", "Navigation"),
        links("headerButtons", "Header buttons"),
        defineField({
          name: "hero",
          type: "object",
          fields: [
            str("eyebrow"), str("title"), str("subtitle"), str("servingLine"), str("availability"),
            str("ctaLabel"), str("badge"), str("contactLabel"), strings("notes", "Sticky notes"),
          ],
        }),
        strings("highlights"),
        str("highlightsHeading", "Highlights heading"),
        defineField({
          name: "intro",
          type: "object",
          fields: [
            str("heading"),
            defineField({
              name: "cards",
              type: "array",
              of: [{ type: "object", name: "introCard", fields: [txt("body")] }],
            }),
          ],
        }),
        defineField({
          name: "services",
          type: "object",
          fields: [
            str("heading"),
            str("ctaLabel"),
            defineField({
              name: "items",
              type: "array",
              of: [{ type: "object", name: "serviceItem", fields: [str("title"), txt("body")] }],
            }),
          ],
        }),
        defineField({
          name: "faq",
          title: "FAQ",
          type: "object",
          fields: [
            str("heading"),
            defineField({
              name: "items",
              type: "array",
              of: [
                {
                  type: "object",
                  name: "faqItem",
                  fields: [str("question"), txt("answer", "Answer", RICH)],
                  preview: { select: { title: "question" } },
                },
              ],
            }),
          ],
        }),
        defineField({
          name: "forms",
          title: "Client forms",
          type: "object",
          fields: [
            str("heading"),
            defineField({
              name: "groups",
              type: "array",
              of: [
                {
                  type: "object",
                  name: "formGroup",
                  fields: [str("heading"), links("links")],
                  preview: { select: { title: "heading" } },
                },
              ],
            }),
            defineField({ name: "portalLink", type: "linkItem" }),
          ],
        }),
        defineField({
          name: "loans",
          title: "Cash advance / loans",
          type: "object",
          fields: [
            str("heading"),
            str("subheading"),
            strings("promoLines"),
            str("promoBadge"),
            str("partnerLogoUrl", "Partner logo URL"),
            str("partnerName"),
            defineField({
              name: "cards",
              type: "array",
              of: [{ type: "object", name: "loanCard", fields: [str("title"), str("detail")] }],
            }),
            defineField({
              name: "disclaimers",
              type: "array",
              of: [{ type: "text" }],
              description: "Numbered footnotes shown under the loan cards. Paste the exact legal text.",
            }),
          ],
        }),
        defineField({ name: "cta", title: "Call to action", type: "object", fields: [str("heading"), str("buttonLabel")] }),
        defineField({ name: "contact", type: "object", fields: [str("heading"), str("intro"), str("credentialLine")] }),
        defineField({ name: "footer", type: "object", fields: [txt("text"), links("links")] }),
      ],
    }),
  ],
  preview: {
    select: { number: "number", name: "name" },
    prepare: ({ number, name }) => ({ title: `Template ${number}`, subtitle: name }),
  },
});
