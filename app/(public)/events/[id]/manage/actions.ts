"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { eventSchema, type EventInput } from "@/lib/validators/event";
import { parseNairobiDateTime } from "@/lib/format";
import {
  getUserEventRole,
  CAN_EDIT_ROLES,
  CAN_DELETE_ROLES,
  CAN_MANAGE_ROLES,
  ASSIGNABLE_ROLES,
} from "@/lib/events";
import { sendEmail } from "@/lib/email";
import { roleAssignmentEmail } from "@/lib/emails";

export async function updateEventAction(eventId: string, input: EventInput) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = await getUserEventRole(session.user.id, eventId);
  if (!role || !CAN_EDIT_ROLES.includes(role)) {
    return { errors: { title: ["You don't have permission to edit this event."] } };
  }

  const parsed = eventSchema.safeParse(input);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;

  // Ensure a private event always has an access code (generate on first switch).
  const current = await prisma.event.findUnique({
    where: { id: eventId },
    select: { accessCode: true },
  });
  const accessCode =
    d.visibility === "PRIVATE"
      ? (current?.accessCode ?? crypto.randomUUID().slice(0, 8).toUpperCase())
      : (current?.accessCode ?? null);

  await prisma.event.update({
    where: { id: eventId },
    data: {
      title: d.title,
      description: d.description,
      categoryId: d.categoryId,
      format: d.format,
      venue: d.format === "IN_PERSON" ? d.venue || null : null,
      virtualLink: d.format === "VIRTUAL" ? d.virtualLink || null : null,
      startAt: parseNairobiDateTime(d.startAt),
      endAt: d.endAt ? parseNairobiDateTime(d.endAt) : null,
      registrationDeadline: d.registrationDeadline
        ? parseNairobiDateTime(d.registrationDeadline)
        : null,
      capacity: d.capacity ? Number(d.capacity) : null,
      visibility: d.visibility,
      recurrence: d.recurrence,
      accessCode,
      bannerImage: d.bannerImage || null,
      logo: d.logo || null,
    },
  });

  revalidatePath(`/events/${eventId}`);
  redirect(`/events/${eventId}`);
}

export async function deleteEventAction(eventId: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = await getUserEventRole(session.user.id, eventId);
  if (!role || !CAN_DELETE_ROLES.includes(role)) {
    throw new Error("You don't have permission to delete this event.");
  }

  await prisma.event.delete({ where: { id: eventId } });
  redirect("/events");
}

// ---- Team & roles ---------------------------------------------------------

export type RoleFormState = { error?: string; success?: string };

export async function assignRoleAction(
  eventId: string,
  _prev: RoleFormState,
  formData: FormData,
): Promise<RoleFormState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const requesterRole = await getUserEventRole(session.user.id, eventId);
  if (!requesterRole || !CAN_MANAGE_ROLES.includes(requesterRole)) {
    return { error: "You don't have permission to manage roles." };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "");
  if (!email) return { error: "Enter an email address." };
  if (!ASSIGNABLE_ROLES.includes(role as (typeof ASSIGNABLE_ROLES)[number])) {
    return { error: "Choose a valid role." };
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true } });
  if (!user) return { error: "No account found with this email address." };

  const existing = await getUserEventRole(user.id, eventId);
  if (existing === "HOST") return { error: "That user is the host of this event." };

  await prisma.eventRole.upsert({
    where: { eventId_userId: { eventId, userId: user.id } },
    update: { role },
    create: { eventId, userId: user.id, role },
  });

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (event) {
    await sendEmail({
      to: email,
      ...roleAssignmentEmail(user.name, event, role),
    });
  }

  revalidatePath(`/events/${eventId}/manage`);
  return { success: `${user.name} is now a ${role.toLowerCase()}.` };
}

export async function removeRoleAction(eventId: string, userId: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const requesterRole = await getUserEventRole(session.user.id, eventId);
  if (!requesterRole || !CAN_MANAGE_ROLES.includes(requesterRole)) {
    throw new Error("You don't have permission to manage roles.");
  }

  const target = await prisma.eventRole.findUnique({
    where: { eventId_userId: { eventId, userId } },
  });
  if (target && target.role !== "HOST") {
    await prisma.eventRole.delete({
      where: { eventId_userId: { eventId, userId } },
    });
  }
  revalidatePath(`/events/${eventId}/manage`);
}

// ---- Private-event invites -----------------------------------------------

export type InviteFormState = { error?: string; success?: string };

export async function addInviteAction(
  eventId: string,
  _prev: InviteFormState,
  formData: FormData,
): Promise<InviteFormState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = await getUserEventRole(session.user.id, eventId);
  if (!role || !CAN_EDIT_ROLES.includes(role)) {
    return { error: "You don't have permission to manage invites." };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { error: "Enter a valid email address." };
  }

  await prisma.eventInvite.upsert({
    where: { eventId_email: { eventId, email } },
    update: {},
    create: { eventId, email },
  });

  revalidatePath(`/events/${eventId}/manage`);
  return { success: `${email} added to the invite list.` };
}

export async function removeInviteAction(eventId: string, email: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = await getUserEventRole(session.user.id, eventId);
  if (!role || !CAN_EDIT_ROLES.includes(role)) {
    throw new Error("You don't have permission to manage invites.");
  }

  await prisma.eventInvite.deleteMany({ where: { eventId, email } });
  revalidatePath(`/events/${eventId}/manage`);
}
