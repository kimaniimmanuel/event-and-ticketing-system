"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { orgSchema, type OrgInput } from "@/lib/validators/org";
import { getUserOrgRole, CAN_MANAGE_ORG, CAN_MANAGE_ORG_ADMINS } from "@/lib/orgs";

async function requireOrgRole(orgId: string, allowed: string[]) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const role = await getUserOrgRole(session.user.id, orgId);
  if (!role || !allowed.includes(role)) return null;
  return session.user.id;
}

export async function updateOrgAction(orgId: string, slug: string, input: OrgInput) {
  const userId = await requireOrgRole(orgId, CAN_MANAGE_ORG);
  if (!userId) return { errors: { name: ["You don't have permission to edit this organization."] } };

  const parsed = orgSchema.safeParse(input);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };
  const { name, description, logo, banner } = parsed.data;

  const clash = await prisma.organization.findFirst({
    where: { name, NOT: { id: orgId } },
    select: { id: true },
  });
  if (clash) return { errors: { name: ["An organization with this name already exists."] } };

  await prisma.organization.update({
    where: { id: orgId },
    data: { name, description: description || null, logo: logo || null, banner: banner || null },
  });

  revalidatePath(`/orgs/${slug}`);
  revalidatePath(`/orgs/${slug}/manage`);
  return {};
}

// ---- Admins ---------------------------------------------------------------

export type OrgAdminState = { error?: string; success?: string };

export async function addOrgAdminAction(
  orgId: string,
  slug: string,
  _prev: OrgAdminState,
  formData: FormData,
): Promise<OrgAdminState> {
  const userId = await requireOrgRole(orgId, CAN_MANAGE_ORG_ADMINS);
  if (!userId) return { error: "Only the owner can manage admins." };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { error: "Enter an email address." };

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true } });
  if (!user) return { error: "No account found with this email address." };

  const existing = await getUserOrgRole(user.id, orgId);
  if (existing === "OWNER") return { error: "That user is the owner." };

  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: orgId, userId: user.id } },
    update: { role: "ADMIN" },
    create: { organizationId: orgId, userId: user.id, role: "ADMIN" },
  });

  revalidatePath(`/orgs/${slug}/manage`);
  return { success: `${user.name} is now an admin.` };
}

export async function removeOrgAdminAction(orgId: string, slug: string, userId: string) {
  const requester = await requireOrgRole(orgId, CAN_MANAGE_ORG_ADMINS);
  if (!requester) throw new Error("Only the owner can manage admins.");

  const target = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId: orgId, userId } },
  });
  if (target && target.role !== "OWNER") {
    await prisma.organizationMember.delete({
      where: { organizationId_userId: { organizationId: orgId, userId } },
    });
  }
  revalidatePath(`/orgs/${slug}/manage`);
}

// ---- Event association -----------------------------------------------------

export async function setEventOrgAction(
  orgId: string,
  slug: string,
  eventId: string,
  attach: boolean,
) {
  const userId = await requireOrgRole(orgId, CAN_MANAGE_ORG);
  if (!userId) throw new Error("You don't have permission to manage this organization.");

  // Only the event's host may attach/detach their event.
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { hostId: true },
  });
  if (!event || event.hostId !== userId) {
    throw new Error("You can only associate events you host.");
  }

  await prisma.event.update({
    where: { id: eventId },
    data: { organizationId: attach ? orgId : null },
  });

  revalidatePath(`/orgs/${slug}`);
  revalidatePath(`/orgs/${slug}/manage`);
}
