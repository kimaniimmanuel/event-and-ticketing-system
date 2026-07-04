import { prisma } from "@/lib/db";

/** Roles that may edit the org and associate events. */
export const CAN_MANAGE_ORG = ["OWNER", "ADMIN"];
/** Roles that may add/remove admins (owner only). */
export const CAN_MANAGE_ORG_ADMINS = ["OWNER"];

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Generate a slug that isn't already taken. */
export async function uniqueOrgSlug(name: string) {
  const base = slugify(name) || "org";
  let candidate = base;
  let n = 1;
  while (await prisma.organization.findUnique({ where: { slug: candidate } })) {
    candidate = `${base}-${n++}`;
  }
  return candidate;
}

/** The viewer's role within an organization, or null. */
export async function getUserOrgRole(
  userId: string | undefined,
  organizationId: string,
): Promise<string | null> {
  if (!userId) return null;
  const member = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId } },
    select: { role: true },
  });
  return member?.role ?? null;
}
