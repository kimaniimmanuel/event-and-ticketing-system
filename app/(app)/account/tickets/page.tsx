import Link from "next/link";
import { CalendarDays, MapPin, Video, Download, CalendarPlus, Ticket } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Card, CardBody, Badge } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { formatEventDate } from "@/lib/format";
import { qrDataUrl, checkInUrl } from "@/lib/qr";
import { googleCalendarUrl } from "@/lib/ics";
import { CancelRegistrationButton } from "./ticket-actions";

export const metadata = { title: "My tickets" };

export default async function MyTicketsPage() {
  const session = await auth();
  const registrations = await prisma.registration.findMany({
    where: { userId: session!.user.id },
    include: { event: true, ticket: true },
    orderBy: { createdAt: "desc" },
  });

  const cards = await Promise.all(
    registrations.map(async (reg) => ({
      reg,
      qr:
        reg.ticket && reg.status === "CONFIRMED"
          ? await qrDataUrl(checkInUrl(reg.eventId, reg.ticket.code))
          : null,
    })),
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">My tickets</h1>

      {cards.length === 0 ? (
        <Card>
          <CardBody className="flex flex-col items-center gap-3 py-12 text-center text-muted">
            <Ticket className="h-8 w-8" />
            <p>You haven&apos;t registered for any events yet.</p>
            <ButtonLink href="/events">Discover events</ButtonLink>
          </CardBody>
        </Card>
      ) : (
        cards.map(({ reg, qr }) => {
          const isVirtual = reg.event.format === "VIRTUAL";
          const cancelled = reg.status === "CANCELLED";
          return (
            <Card key={reg.id} className={cancelled ? "opacity-60" : ""}>
              <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex shrink-0 items-center justify-center">
                  {qr ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={qr}
                      alt="Ticket QR code"
                      className="h-32 w-32 rounded-lg border border-border"
                    />
                  ) : (
                    <div className="flex h-32 w-32 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted">
                      Cancelled
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        cancelled ? "" : "bg-success/10 text-success"
                      }
                    >
                      {cancelled ? "Cancelled" : "Confirmed"}
                    </Badge>
                  </div>
                  <Link
                    href={`/events/${reg.eventId}`}
                    className="text-lg font-semibold hover:text-primary"
                  >
                    {reg.event.title}
                  </Link>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-4 w-4" />
                      {formatEventDate(reg.event.startAt)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      {isVirtual ? (
                        <Video className="h-4 w-4" />
                      ) : (
                        <MapPin className="h-4 w-4" />
                      )}
                      {isVirtual ? "Online" : (reg.event.venue ?? "TBA")}
                    </span>
                  </div>

                  {!cancelled && (
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <a
                        href={`/api/tickets/${reg.ticket!.id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </a>
                      <a
                        href={`/api/events/${reg.eventId}/ics`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                      >
                        <CalendarPlus className="h-4 w-4" />
                        Add to calendar
                      </a>
                      <a
                        href={googleCalendarUrl(reg.event)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Google Calendar
                      </a>
                      <CancelRegistrationButton registrationId={reg.id} />
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          );
        })
      )}
    </div>
  );
}
