import { defineField, defineType } from "sanity";

export const site = defineType({
  name: "site",
  title: "Site",
  type: "document",
  fields: [
    defineField({ name: "businessName", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "businessName", maxLength: 50 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "published",
      type: "boolean",
      initialValue: true,
      description: "Turn off to take the page offline.",
    }),
    defineField({ name: "templateNumber", type: "number", validation: (r) => r.required().integer().min(1).max(7) }),
    defineField({ name: "fullName", type: "string", validation: (r) => r.required() }),
    defineField({ name: "email", type: "string", validation: (r) => r.required().email() }),
    defineField({ name: "phone", type: "string", validation: (r) => r.required() }),
    defineField({ name: "address", type: "text", rows: 2, validation: (r) => r.required() }),
    defineField({ name: "servingArea", type: "string", validation: (r) => r.required() }),
    defineField({ name: "logo", type: "image", validation: (r) => r.required() }),
    defineField({ name: "photo", type: "image", validation: (r) => r.required() }),
    defineField({ name: "createdAt", type: "datetime", readOnly: true }),
  ],
  preview: { select: { title: "businessName", subtitle: "slug.current", media: "logo" } },
});
