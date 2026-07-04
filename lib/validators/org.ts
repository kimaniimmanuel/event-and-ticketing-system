import { z } from "zod";

export const orgSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  description: z.string().max(2000).optional().or(z.literal("")),
  logo: z.string().url("Enter a valid image URL").optional().or(z.literal("")),
  banner: z.string().url("Enter a valid image URL").optional().or(z.literal("")),
});

export type OrgInput = z.infer<typeof orgSchema>;
