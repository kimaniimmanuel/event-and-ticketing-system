import Link from "next/link";
import { CalendarDays, MapPin, Video, Users } from "lucide-react";
import { Card, CardBody, Badge } from "@/components/ui/card";
import { formatEventDateShort } from "@/lib/format";

export type EventCardData = {
  id: string;
  title: string;
  description: string;
  bannerImage: string | null;
  startAt: Date;
  format: string;
  venue: string | null;
  capacity: number | null;
  category: { name: string };
};

export function EventCard({ event }: { event: EventCardData }) {
  const isVirtual = event.format === "VIRTUAL";

  return (
    <Link href={`/events/${event.id}`} className="group block">
      <Card className="h-full overflow-hidden transition-shadow group-hover:shadow-md">
        <div className="flex h-32 items-center justify-center bg-primary/10">
          {event.bannerImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.bannerImage}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <CalendarDays className="h-10 w-10 text-primary/40" />
          )}
        </div>
        <CardBody className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/10 text-primary">{event.category.name}</Badge>
            <Badge>
              {isVirtual ? (
                <Video className="mr-1 h-3 w-3" />
              ) : (
                <MapPin className="mr-1 h-3 w-3" />
              )}
              {isVirtual ? "Virtual" : "In person"}
            </Badge>
          </div>
          <h3 className="font-semibold leading-snug group-hover:text-primary">
            {event.title}
          </h3>
          <p className="line-clamp-2 text-sm text-muted">{event.description}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-sm text-muted">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              {formatEventDateShort(event.startAt)}
            </span>
            {event.venue && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {event.venue}
              </span>
            )}
            {event.capacity != null && (
              <span className="inline-flex items-center gap-1">
                <Users className="h-4 w-4" />
                {event.capacity} spots
              </span>
            )}
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}
