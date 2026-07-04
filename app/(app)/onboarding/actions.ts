"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

/** Save the user's category interests, then head to discovery. */
export async function saveOnboardingAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const selectedIds = formData.getAll("categoryIds").map(String).filter(Boolean);

  // Only persist ids that are real categories.
  const validCategories = await prisma.category.findMany({
    where: { id: { in: selectedIds } },
    select: { id: true },
  });

  await prisma.userInterest.deleteMany({ where: { userId } });
  if (validCategories.length > 0) {
    await prisma.userInterest.createMany({
      data: validCategories.map((c) => ({ userId, categoryId: c.id })),
    });
  }

  redirect("/events");
}
