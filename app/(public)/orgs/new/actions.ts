"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { orgSchema, type OrgInput } from "@/lib/validators/org";
import { uniqueOrgSlug } from "@/lib/orgs";

export async function createOrgAction(input: OrgInput) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const parsed = orgSchema.safeParse(input);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  const { name, description, logo, banner } = parsed.data;

  const existing = await prisma.organization.findUnique({ where: { name } });
  if (existing) {
    return { errors: { name: ["An organization with this name already exists."] } };
  }

  const slug = await uniqueOrgSlug(name);
  const org = await prisma.organization.create({
    data: {
      name,
      slug,
      description: description || null,
      logo: logo || null,
      banner: banner || null,
      ownerId: userId,
      members: { create: { userId, role: "OWNER" } },
    },
  });

  redirect(`/orgs/${org.slug}/manage`);
}
