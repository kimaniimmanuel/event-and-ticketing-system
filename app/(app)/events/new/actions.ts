"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { eventSchema, type EventInput } from "@/lib/validators/event";
import { parseNairobiDateTime } from "@/lib/format";

export async function createEventAction(input: EventInput) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const parsed = eventSchema.safeParse(input);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;

  const event = await prisma.event.create({
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
      accessCode:
        d.visibility === "PRIVATE" ? crypto.randomUUID().slice(0, 8).toUpperCase() : null,
      hostId: userId,
      roles: { create: { userId, role: "HOST" } },
    },
  });

  redirect(`/events/${event.id}`);
}
