import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Card, CardBody } from "@/components/ui/card";
import { getUserEventRole, CAN_CHECKIN_ROLES } from "@/lib/events";
import { checkInAction } from "./actions";
import { CheckInPanel } from "./check-in-panel";

export const metadata = { title: "Check in" };

export default async function CheckInPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ code?: string }>;
}) {
  const { id } = await params;
  const { code } = await searchParams;
  const session = await auth();
  if (!session?.user?.id) redirect(`/login?callbackUrl=/events/${id}/check-in`);

  const event = await prisma.event.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      capacity: true,
      _count: {
        select: {
          registrations: { where: { status: "CONFIRMED" } },
        },
      },
    },
  });
  if (!event) notFound();

  const role = await getUserEventRole(session.user.id, id);
  if (!role || !CAN_CHECKIN_ROLES.includes(role)) {
    redirect(`/events/${id}`);
  }

  // Count how many have already been checked in.
  const checkedIn = await prisma.ticket.count({
    where: { status: "USED", registration: { eventId: id } },
  });

  // If arriving from a scanned QR link (?code=…), check that ticket in immediately.
  const initialResult = code ? await checkInAction(id, code) : undefined;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link
        href={`/events/${id}`}
        className="inline-flex items-center gap-1 text-sm text-muted hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to event
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Check in</h1>
        <p className="text-sm text-muted">{event.title}</p>
        <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted">
          <Users className="h-4 w-4" />
          {checkedIn} of {event._count.registrations} attendees checked in
        </p>
      </div>

      <Card>
        <CardBody>
          <CheckInPanel eventId={id} initialResult={initialResult} />
        </CardBody>
      </Card>
    </div>
  );
}
