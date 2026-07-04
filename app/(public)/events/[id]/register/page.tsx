import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CalendarDays, MapPin, Video, CheckCircle2 } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Card, CardBody } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { formatEventDate } from "@/lib/format";
import { hasEventAccess } from "@/lib/events";
import { RegisterForm } from "./register-form";

export const metadata = { title: "Register" };

export default async function RegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ code?: string }>;
}) {
  const { id } = await params;
  const { code } = await searchParams;
  const session = await auth();
  if (!session?.user?.id) redirect(`/login?callbackUrl=/events/${id}/register`);

  const event = await prisma.event.findUnique({
    where: { id },
    include: { _count: { select: { registrations: { where: { status: "CONFIRMED" } } } } },
  });
  if (!event || event.status !== "PUBLISHED") notFound();

  // Private events require access (code, allowlist, or role); otherwise send them
  // to the event page which shows the access gate.
  const access = await hasEventAccess({
    event,
    userId: session.user.id,
    userEmail: session.user.email,
    code,
  });
  if (!access) redirect(`/events/${id}`);

  const [user, existing] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true },
    }),
    prisma.registration.findUnique({
      where: { eventId_userId: { eventId: id, userId: session.user.id } },
    }),
  ]);

  const alreadyRegistered = existing?.status === "CONFIRMED";
  const isFull =
    event.capacity != null && event._count.registrations >= event.capacity;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <p className="text-sm text-muted">You&apos;re registering for</p>
        <h1 className="text-2xl font-bold">{event.title}</h1>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-4 w-4" />
            {formatEventDate(event.startAt)}
          </span>
          <span className="inline-flex items-center gap-1">
            {event.format === "VIRTUAL" ? (
              <Video className="h-4 w-4" />
            ) : (
              <MapPin className="h-4 w-4" />
            )}
            {event.format === "VIRTUAL" ? "Online" : (event.venue ?? "TBA")}
          </span>
        </div>
      </div>

      <Card>
        <CardBody>
          {alreadyRegistered ? (
            <div className="space-y-4 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
              <p className="font-medium">You&apos;re already registered for this event.</p>
              <ButtonLink href="/account/tickets">View my ticket</ButtonLink>
            </div>
          ) : isFull ? (
            <div className="space-y-2 text-center">
              <p className="font-medium">This event is fully booked.</p>
              <Link href={`/events/${id}`} className="text-sm text-primary hover:underline">
                Back to event
              </Link>
            </div>
          ) : (
            <RegisterForm
              eventId={id}
              defaults={{ name: user?.name ?? "", email: user?.email ?? "" }}
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
