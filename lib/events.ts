import { prisma } from "@/lib/db";

/** Roles that may edit an event's details. */
export const CAN_EDIT_ROLES = ["HOST", "COHOST", "ADMIN"];
/** Roles that may delete an event. */
export const CAN_DELETE_ROLES = ["HOST"];
/** Roles that may check attendees in. */
export const CAN_CHECKIN_ROLES = ["HOST", "COHOST", "ADMIN", "VOLUNTEER"];

/** Returns the viewer's role for an event, or null if they have none. */
export async function getUserEventRole(
  userId: string | undefined,
  eventId: string,
): Promise<string | null> {
  if (!userId) return null;
  const role = await prisma.eventRole.findUnique({
    where: { eventId_userId: { eventId, userId } },
    select: { role: true },
  });
  return role?.role ?? null;
}
