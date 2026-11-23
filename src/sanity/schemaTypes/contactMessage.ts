import { defineField, defineType } from "sanity";

export const contactMessage = defineType({
  name: "contactMessage",
  title: "Contact message",
  type: "document",
  readOnly: true,
  fields: [
    defineField({ name: "site", type: "reference", to: [{ type: "site" }] }),
    defineField({ name: "name", type: "string" }),
    defineField({ name: "email", type: "string" }),
    defineField({ name: "phone", type: "string" }),
    defineField({ name: "message", type: "text" }),
    defineField({ name: "emailStatus", type: "string", options: { list: ["sent", "failed"] } }),
    defineField({ name: "sentAt", type: "datetime" }),
  ],
  orderings: [{ title: "Newest", name: "sentAtDesc", by: [{ field: "sentAt", direction: "desc" }] }],
  preview: { select: { title: "name", subtitle: "email" } },
});
