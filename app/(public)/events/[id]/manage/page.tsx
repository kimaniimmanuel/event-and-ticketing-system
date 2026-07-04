import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Card, CardBody } from "@/components/ui/card";
import { EventForm } from "@/components/events/event-form";
import { getUserEventRole, CAN_EDIT_ROLES, CAN_DELETE_ROLES } from "@/lib/events";
import { toDateTimeLocalValue } from "@/lib/format";
import { updateEventAction } from "./actions";
import { DeleteEventButton } from "./delete-event-button";

export const metadata = { title: "Manage event" };

export default async function ManageEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) notFound();

  const role = await getUserEventRole(session.user.id, id);
  if (!role || !CAN_EDIT_ROLES.includes(role)) {
    // Not a manager of this event.
    redirect(`/events/${id}`);
  }

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={`/events/${id}`}
        className="inline-flex items-center gap-1 text-sm text-muted hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to event
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Manage event</h1>
        <p className="text-sm text-muted">
          You are the {role.toLowerCase()} of this event.
        </p>
      </div>

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
              capacity: event.capacity != null ? String(event.capacity) : "",
              visibility: event.visibility as "PUBLIC" | "PRIVATE",
              recurrence: event.recurrence as "NONE" | "DAILY" | "WEEKLY" | "MONTHLY",
              bannerImage: event.bannerImage ?? "",
              logo: event.logo ?? "",
            }}
          />
        </CardBody>
      </Card>

      {event.visibility === "PRIVATE" && event.accessCode && (
        <Card>
          <CardBody className="space-y-1">
            <h2 className="font-semibold">Private access</h2>
            <p className="text-sm text-muted">
              Access code: <span className="font-mono font-semibold">{event.accessCode}</span>
            </p>
            <p className="text-xs text-muted">
              Full invite management (referral links, email allowlist) arrives in Sprint 7.
            </p>
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
