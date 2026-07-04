import { z } from "zod";

export const registrationSchema = z.object({
  name: z.string().min(2, "Name is required").max(80),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().max(20).optional().or(z.literal("")),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;
