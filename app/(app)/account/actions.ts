"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { profileSchema } from "@/lib/validators/profile";

export type ProfileFormState = {
  errors?: Record<string, string[] | undefined>;
  message?: string;
};

export async function updateProfileAction(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  const { name, username, location, avatar } = parsed.data;

  const taken = await prisma.user.findFirst({
    where: { username, NOT: { id: userId } },
    select: { id: true },
  });
  if (taken) {
    return { errors: { username: ["That username is taken."] } };
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      name,
      username,
      location: location || null,
      avatar: avatar || null,
    },
  });

  revalidatePath("/account");
  return { message: "Profile saved." };
}
