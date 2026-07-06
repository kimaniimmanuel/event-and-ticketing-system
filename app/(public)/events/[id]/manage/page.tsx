import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ScanLine, BarChart3, Lock } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Card, CardBody } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { EventForm } from "@/components/events/event-form";
import {
  getUserEventRole,
  CAN_EDIT_ROLES,
  CAN_DELETE_ROLES,
  CAN_MANAGE_ROLES,
  hasEventStarted,
} from "@/lib/events";
import { toDateTimeLocalValue } from "@/lib/format";
import { updateEventAction } from "./actions";
import { DeleteEventButton } from "./delete-event-button";
import { TeamManager } from "./team-manager";
import { InviteManager } from "./invite-manager";

export const metadata = { title: "Manage event" };

export default async function ManageEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      roles: { include: { user: { select: { name: true, username: true } } } },
      invites: { orderBy: { email: "asc" } },
    },
  });
  if (!event) notFound();

  const role = await getUserEventRole(session.user.id, id);
  if (!role || !CAN_EDIT_ROLES.includes(role)) {
    redirect(`/events/${id}`);
  }

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const roleOrder = ["HOST", "COHOST", "ADMIN", "VOLUNTEER"];
  const members = event.roles
    .map((r) => ({
      userId: r.userId,
      name: r.user.name,
      username: r.user.username,
      role: r.role,
    }))
    .sort((a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role));

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3210";
  const inviteUrl = `${baseUrl}/events/${id}?code=${event.accessCode ?? ""}`;
  const isPast = hasEventStarted(event.startAt);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={`/events/${id}`}
        className="inline-flex items-center gap-1 text-sm text-muted hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to event
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Manage event</h1>
          <p className="text-sm text-muted">You are the {role.toLowerCase()} of this event.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ButtonLink href={`/events/${id}/analytics`} variant="outline" size="sm">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </ButtonLink>
          {!isPast && (
            <ButtonLink href={`/events/${id}/check-in`} variant="outline" size="sm">
              <ScanLine className="h-4 w-4" />
              Check in
            </ButtonLink>
          )}
        </div>
      </div>

      {isPast ? (
        <Card>
          <CardBody className="flex items-center gap-3">
            <Lock className="h-5 w-5 shrink-0 text-muted" />
            <div>
              <p className="font-medium">This event has already taken place.</p>
              <p className="text-sm text-muted">
                Its details, team, and registrations can no longer be edited. You can still view
                its analytics or delete it below.
              </p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody>
            <EventForm
              categories={categories}
              action={updateEventAction.bind(null, id)}
              submitLabel="Save changes"
              defaultValues={{
                title: event.title,
                description: event.description,
                categoryId: event.categoryId,
                format: event.format as "IN_PERSON" | "VIRTUAL",
                venue: event.venue ?? "",
                virtualLink: event.virtualLink ?? "",
                startAt: toDateTimeLocalValue(event.startAt),
                endAt: event.endAt ? toDateTimeLocalValue(event.endAt) : "",
                registrationDeadline: event.registrationDeadline
                  ? toDateTimeLocalValue(event.registrationDeadline)
                  : "",
                capacity: event.capacity != null ? String(event.capacity) : "",
                visibility: event.visibility as "PUBLIC" | "PRIVATE",
                recurrence: event.recurrence as "NONE" | "DAILY" | "WEEKLY" | "MONTHLY",
                bannerImage: event.bannerImage ?? "",
                logo: event.logo ?? "",
              }}
            />
          </CardBody>
        </Card>
      )}

      {!isPast && (
        <Card>
          <CardBody className="space-y-4">
            <div>
              <h2 className="font-semibold">Team &amp; roles</h2>
              <p className="text-sm text-muted">
                Add co-hosts, admins, and volunteers to help run this event.
              </p>
            </div>
            <TeamManager
              eventId={id}
              members={members}
              canManage={CAN_MANAGE_ROLES.includes(role)}
            />
          </CardBody>
        </Card>
      )}

      {!isPast && event.visibility === "PRIVATE" && (
        <Card>
          <CardBody className="space-y-3">
            <h2 className="font-semibold">Private access</h2>
            <InviteManager
              eventId={id}
              inviteUrl={inviteUrl}
              accessCode={event.accessCode ?? ""}
              invites={event.invites.map((i) => i.email)}
            />
          </CardBody>
        </Card>
      )}

      {CAN_DELETE_ROLES.includes(role) && (
        <Card className="border-danger/30">
          <CardBody className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-danger">Danger zone</h2>
              <p className="text-sm text-muted">
                Deleting an event is permanent and removes all registrations.
              </p>
            </div>
            <DeleteEventButton eventId={id} />
          </CardBody>
        </Card>
      )}
    </div>
  );
}
