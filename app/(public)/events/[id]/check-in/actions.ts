"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getUserEventRole, CAN_CHECKIN_ROLES } from "@/lib/events";
import { formatEventTime } from "@/lib/format";

export type CheckInStatus =
  | "success"
  | "already"
  | "invalid"
  | "notfound"
  | "wrong_event"
  | "forbidden";

export type CheckInResult = {
  status: CheckInStatus;
  message: string;
  attendee?: string;
  at?: string;
};

/** Pull the ticket code out of a raw scan (a URL, a "code=…" fragment, or the code itself). */
function extractCode(raw: string): string {
  const trimmed = raw.trim();
  try {
    const url = new URL(trimmed);
    const c = url.searchParams.get("code");
    if (c) return c;
  } catch {
    // not a URL — fall through
  }
  const match = trimmed.match(/code=([^&\s]+)/);
  return match ? match[1] : trimmed;
}

export async function checkInAction(
  eventId: string,
  rawCode: string,
): Promise<CheckInResult> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const role = await getUserEventRole(session.user.id, eventId);
  if (!role || !CAN_CHECKIN_ROLES.includes(role)) {
    return { status: "forbidden", message: "You don't have permission to check attendees in." };
  }

  const code = extractCode(rawCode);
  if (!code) return { status: "notfound", message: "No ticket code provided." };

  const ticket = await prisma.ticket.findUnique({
    where: { code },
    include: {
      registration: { include: { event: { select: { id: true } } } },
    },
  });

  if (!ticket) return { status: "notfound", message: "Ticket not recognised." };
  if (ticket.registration.event.id !== eventId) {
    return { status: "wrong_event", message: "This ticket is for a different event." };
  }
  if (ticket.status === "INVALID") {
    return { status: "invalid", message: "This ticket has been cancelled." };
  }
  if (ticket.status === "USED") {
    return {
      status: "already",
      message: "Already checked in.",
      attendee: ticket.registration.name,
      at: ticket.checkedInAt ? formatEventTime(ticket.checkedInAt) : undefined,
    };
  }

  await prisma.ticket.update({
    where: { id: ticket.id },
    data: { status: "USED", checkedInAt: new Date(), checkedInById: session.user.id },
  });

  return {
    status: "success",
    message: "Checked in!",
    attendee: ticket.registration.name,
  };
}
