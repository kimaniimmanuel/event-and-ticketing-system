import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CalendarDays, Clock, MapPin, Video, Users, Tag } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Card, CardBody, Badge } from "@/components/ui/card";
import { ButtonLink, Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { formatEventDate, formatEventTime } from "@/lib/format";

async function getEvent(id: string) {
  return prisma.event.findUnique({
    where: { id },
    include: {
      category: true,
      host: { select: { name: true, username: true, avatar: true } },
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
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEvent(id);

  // Private-event access control arrives in Sprint 7; hide them from the public route for now.
  if (!event || event.status !== "PUBLISHED" || event.visibility !== "PUBLIC") {
    notFound();
  }

  const session = await auth();
  const isVirtual = event.format === "VIRTUAL";
  const confirmed = event._count.registrations;
  const spotsLeft = event.capacity != null ? event.capacity - confirmed : null;
  const isFull = spotsLeft != null && spotsLeft <= 0;

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

              {!session?.user ? (
                <ButtonLink
                  href={`/login?callbackUrl=/events/${event.id}`}
                  size="lg"
                  className="w-full"
                >
                  Log in to register
                </ButtonLink>
              ) : (
                // Full RSVP flow lands in Sprint 5.
                <Button size="lg" className="w-full" disabled>
                  {isFull ? "Fully booked" : "Register (coming in Sprint 5)"}
                </Button>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </article>
  );
}
