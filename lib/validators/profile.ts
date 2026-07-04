import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers and underscores"),
  location: z.string().max(80).optional().or(z.literal("")),
  avatar: z
    .string()
    .url("Enter a valid image URL")
    .optional()
    .or(z.literal("")),
});

export type ProfileInput = z.infer<typeof profileSchema>;
