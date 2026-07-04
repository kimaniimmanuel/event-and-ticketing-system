import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CalendarDays, Clock, MapPin, Video, Users, Tag } from "lucide-react";
import { Settings, CheckCircle2, Lock, ScanLine, BarChart3 } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Card, CardBody, Badge } from "@/components/ui/card";
import { ButtonLink, Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import {
  getUserEventRole,
  CAN_EDIT_ROLES,
  CAN_CHECKIN_ROLES,
  hasEventAccess,
  isRegistrationOpen,
} from "@/lib/events";
import { formatEventDate, formatEventTime } from "@/lib/format";

async function getEvent(id: string) {
  return prisma.event.findUnique({
    where: { id },
    include: {
      category: true,
      host: { select: { name: true, username: true, avatar: true } },
      organization: { select: { name: true, slug: true } },
      _count: { select: { registrations: { where: { status: "CONFIRMED" } } } },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) return { title: "Event not found" };
  const description = event.description.slice(0, 160);
  return {
    title: event.title,
    description,
    openGraph: {
      title: event.title,
      description,
      type: "website",
      images: event.bannerImage ? [event.bannerImage] : undefined,
    },
  };
}

export default async function EventDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ code?: string }>;
}) {
  const { id } = await params;
  const { code } = await searchParams;
  const event = await getEvent(id);
  if (!event || event.status !== "PUBLISHED") notFound();

  const session = await auth();
  const role = await getUserEventRole(session?.user?.id, event.id);
  const canManage = Boolean(role && CAN_EDIT_ROLES.includes(role));
  const canCheckIn = Boolean(role && CAN_CHECKIN_ROLES.includes(role));

  // Private events require a valid access code, an allowlist invite, or a role.
  const hasAccess = await hasEventAccess({
    event,
    userId: session?.user?.id,
    userEmail: session?.user?.email,
    code,
  });
  if (event.visibility === "PRIVATE" && !hasAccess) {
    return (
      <div className="mx-auto max-w-md pt-10">
        <Card>
          <CardBody className="space-y-4 text-center">
            <Lock className="mx-auto h-10 w-10 text-muted" />
            <div>
              <h1 className="text-xl font-bold">This event is private</h1>
              <p className="mt-1 text-sm text-muted">
                Please request access from the event organizer, or enter the access code.
              </p>
            </div>
            <form method="get" className="space-y-2 text-left">
              <Label htmlFor="code">Access code</Label>
              <div className="flex gap-2">
                <Input id="code" name="code" placeholder="Enter code" required />
                <Button type="submit">Unlock</Button>
              </div>
              {code && (
                <p className="text-sm text-danger">That access code is not valid.</p>
              )}
            </form>
          </CardBody>
        </Card>
      </div>
    );
  }

  const registerHref = `/events/${event.id}/register${code ? `?code=${encodeURIComponent(code)}` : ""}`;

  const myRegistration = session?.user?.id
    ? await prisma.registration.findUnique({
        where: { eventId_userId: { eventId: event.id, userId: session.user.id } },
        select: { status: true },
      })
    : null;
  const isRegistered = myRegistration?.status === "CONFIRMED";

  const isVirtual = event.format === "VIRTUAL";
  const confirmed = event._count.registrations;
  const spotsLeft = event.capacity != null ? event.capacity - confirmed : null;
  const isFull = spotsLeft != null && spotsLeft <= 0;
  const registrationOpen = isRegistrationOpen(event);

  return (
    <article className="mx-auto max-w-3xl space-y-6">
      <div className="flex h-56 items-center justify-center overflow-hidden rounded-xl bg-primary/10">
        {event.bannerImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.bannerImage} alt="" className="h-full w-full object-cover" />
        ) : (
          <CalendarDays className="h-16 w-16 text-primary/40" />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-primary/10 text-primary">
          <Tag className="mr-1 h-3 w-3" />
          {event.category.name}
        </Badge>
        <Badge>
          {isVirtual ? (
            <Video className="mr-1 h-3 w-3" />
          ) : (
            <MapPin className="mr-1 h-3 w-3" />
          )}
          {isVirtual ? "Virtual" : "In person"}
        </Badge>
      </div>

      <h1 className="text-3xl font-bold">{event.title}</h1>

      {(canManage || canCheckIn) && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
          <p className="text-sm">
            You&apos;re the <span className="font-medium">{role?.toLowerCase()}</span> of this
            event.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {canCheckIn && (
              <ButtonLink href={`/events/${event.id}/check-in`} variant="outline" size="sm">
                <ScanLine className="h-4 w-4" />
                Check in
              </ButtonLink>
            )}
            {canManage && (
              <ButtonLink href={`/events/${event.id}/analytics`} variant="outline" size="sm">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </ButtonLink>
            )}
            {canManage && (
              <ButtonLink href={`/events/${event.id}/manage`} variant="outline" size="sm">
                <Settings className="h-4 w-4" />
                Manage
              </ButtonLink>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardBody className="space-y-3">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-primary" />
                <span>{formatEventDate(event.startAt)}</span>
              </div>
              {event.endAt && (
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <span>Ends {formatEventTime(event.endAt)}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                {isVirtual ? (
                  <>
                    <Video className="h-5 w-5 text-primary" />
                    <span>Online event</span>
                  </>
                ) : (
                  <>
                    <MapPin className="h-5 w-5 text-primary" />
                    <span>{event.venue ?? "Venue to be announced"}</span>
                  </>
                )}
              </div>
            </CardBody>
          </Card>

          <div>
            <h2 className="mb-2 text-lg font-semibold">About this event</h2>
            <p className="whitespace-pre-line text-foreground/90">{event.description}</p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold">Hosted by</h2>
            <div className="flex items-center gap-3">
              <Avatar name={event.host.name} src={event.host.avatar} />
              <div>
                <p className="font-medium">{event.host.name}</p>
                <p className="text-sm text-muted">@{event.host.username}</p>
              </div>
            </div>
            {event.organization && (
              <p className="mt-3 text-sm text-muted">
                Presented by{" "}
                <Link
                  href={`/orgs/${event.organization.slug}`}
                  className="font-medium text-primary hover:underline"
                >
                  {event.organization.name}
                </Link>
              </p>
            )}
          </div>
        </div>

        {/* Registration CTA */}
        <div className="md:col-span-1">
          <Card className="sticky top-20">
            <CardBody className="space-y-4">
              <div>
                <p className="text-sm text-muted">Registration</p>
                <p className="text-lg font-semibold text-success">Free</p>
              </div>

              {event.capacity != null && (
                <p className="inline-flex items-center gap-1 text-sm text-muted">
                  <Users className="h-4 w-4" />
                  {isFull ? "Fully booked" : `${spotsLeft} of ${event.capacity} spots left`}
                </p>
              )}

              {registrationOpen && event.registrationDeadline && (
                <p className="inline-flex items-center gap-1 text-sm text-muted">
                  <Clock className="h-4 w-4" />
                  Registration closes {formatEventDate(event.registrationDeadline)}
                </p>
              )}

              {isRegistered ? (
                <div className="space-y-2">
                  <p className="inline-flex items-center gap-1 text-sm font-medium text-success">
                    <CheckCircle2 className="h-4 w-4" />
                    You&apos;re registered
                  </p>
                  <ButtonLink
                    href="/account/tickets"
                    variant="outline"
                    size="lg"
                    className="w-full"
                  >
                    View my ticket
                  </ButtonLink>
                </div>
              ) : !registrationOpen ? (
                <Button size="lg" className="w-full" disabled>
                  Registration closed
                </Button>
              ) : !session?.user ? (
                <ButtonLink
                  href={`/login?callbackUrl=${encodeURIComponent(registerHref)}`}
                  size="lg"
                  className="w-full"
                >
                  Log in to register
                </ButtonLink>
              ) : isFull ? (
                <Button size="lg" className="w-full" disabled>
                  Fully booked
                </Button>
              ) : (
                <ButtonLink href={registerHref} size="lg" className="w-full">
                  Register
                </ButtonLink>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </article>
  );
}
