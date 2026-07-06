import { prisma } from "@/lib/db";

/**
 * When registration closes: the earlier of the explicit deadline and the event
 * start time. This guarantees past events are always closed.
 */
export function registrationCloseTime(event: {
  startAt: Date;
  registrationDeadline: Date | null;
}): Date {
  const { startAt, registrationDeadline } = event;
  return registrationDeadline && registrationDeadline < startAt
    ? registrationDeadline
    : startAt;
}

/** Whether registration is still open for an event. */
export function isRegistrationOpen(event: {
  startAt: Date;
  registrationDeadline: Date | null;
}): boolean {
  return registrationCloseTime(event).getTime() > Date.now();
}

/**
 * Whether an event has already started (or passed). Once true, the event is
 * locked: its details can no longer be edited.
 */
export function hasEventStarted(startAt: Date): boolean {
  return startAt.getTime() <= Date.now();
}

/** Roles that may edit an event's details. */
export const CAN_EDIT_ROLES = ["HOST", "COHOST", "ADMIN"];
/** Roles that may delete an event. */
export const CAN_DELETE_ROLES = ["HOST"];
/** Roles that may check attendees in. */
export const CAN_CHECKIN_ROLES = ["HOST", "COHOST", "ADMIN", "VOLUNTEER"];
/** Roles that may assign/remove other roles. */
export const CAN_MANAGE_ROLES = ["HOST", "COHOST"];
/** Roles a host may hand out (HOST is implicit for the creator). */
export const ASSIGNABLE_ROLES = ["COHOST", "ADMIN", "VOLUNTEER"] as const;

/**
 * Whether a viewer may see / register for an event. Public events are always
 * accessible; private events require a valid access code, an invite on the
 * email allowlist, or an existing management role.
 */
export async function hasEventAccess(opts: {
  event: { id: string; visibility: string; accessCode: string | null };
  userId?: string;
  userEmail?: string | null;
  code?: string | null;
}): Promise<boolean> {
  const { event, userId, userEmail, code } = opts;
  if (event.visibility === "PUBLIC") return true;
  if (code && event.accessCode && code === event.accessCode) return true;
  if (userId && (await getUserEventRole(userId, event.id))) return true;
  if (userEmail) {
    const invite = await prisma.eventInvite.findUnique({
      where: { eventId_email: { eventId: event.id, email: userEmail } },
    });
    if (invite) return true;
  }
  return false;
}

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
