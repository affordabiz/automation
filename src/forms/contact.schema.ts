import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(100),
  email: z.string().trim().pipe(z.email("Enter a valid email address")),
  phone: z.string().trim().max(30).optional().default(""),
  message: z.string().trim().min(1, "Please enter a message").max(5000),
});

export type ContactInput = z.infer<typeof contactSchema>;
