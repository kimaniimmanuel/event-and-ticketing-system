"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

/** Toggle following an organization. Returns the resulting follow state. */
export async function toggleFollowAction(
  organizationId: string,
  slug: string,
): Promise<{ following: boolean }> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const existing = await prisma.organizationFollow.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
  });

  if (existing) {
    await prisma.organizationFollow.delete({
      where: { userId_organizationId: { userId, organizationId } },
    });
  } else {
    await prisma.organizationFollow.create({ data: { userId, organizationId } });
  }

  revalidatePath(`/orgs/${slug}`);
  revalidatePath("/orgs");
  return { following: !existing };
}
