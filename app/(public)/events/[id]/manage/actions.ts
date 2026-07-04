"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { eventSchema, type EventInput } from "@/lib/validators/event";
import { parseNairobiDateTime } from "@/lib/format";
import { getUserEventRole, CAN_EDIT_ROLES, CAN_DELETE_ROLES } from "@/lib/events";

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
      capacity: d.capacity ? Number(d.capacity) : null,
      visibility: d.visibility,
      recurrence: d.recurrence,
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
