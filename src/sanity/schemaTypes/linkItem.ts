import { defineField, defineType } from "sanity";

export const linkItem = defineType({
  name: "linkItem",
  title: "Link",
  type: "object",
  fields: [
    defineField({ name: "label", type: "string", validation: (r) => r.required() }),
    defineField({ name: "url", title: "URL", type: "string", validation: (r) => r.required() }),
  ],
  preview: { select: { title: "label", subtitle: "url" } },
});
