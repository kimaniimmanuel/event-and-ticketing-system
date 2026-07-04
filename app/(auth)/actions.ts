"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { prisma } from "@/lib/db";
import { signupSchema, loginSchema } from "@/lib/validators/auth";

export type AuthFormState = {
  errors?: Record<string, string[] | undefined>;
  message?: string;
};

export async function signupAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  const { name, username, email, password } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) {
    return {
      errors:
        existing.email === email
          ? { email: ["An account with this email already exists. Try logging in."] }
          : { username: ["That username is taken. Please choose another."] },
    };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { name, username, email, passwordHash },
  });

  // Sign the new user in; throws a redirect on success.
  await signIn("credentials", {
    email,
    password,
    redirectTo: "/onboarding",
  });
  return {};
}

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/events",
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { message: "Invalid email or password." };
    }
    throw error; // re-throw redirect and other control-flow errors
  }
}
