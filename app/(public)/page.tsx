import { CalendarDays, QrCode, Search } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";

const features = [
  {
    icon: Search,
    title: "Discover events",
    body: "Browse and filter free events by category, location and format — no account needed.",
  },
  {
    icon: CalendarDays,
    title: "Host in minutes",
    body: "Create an event, manage registrations, and share it — all from one place.",
  },
  {
    icon: QrCode,
    title: "Digital tickets",
    body: "Every registration gets a QR ticket for fast, contactless check-in at the door.",
  },
];

export default function LandingPage() {
  return (
    <div className="space-y-16">
      <section className="mx-auto max-w-2xl pt-10 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Ukipata fom, <span className="text-primary">we tokea tu!</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted">
          DUNDA is your one place to discover free events happening around you — and the
          simplest way for organizers to manage registrations and check-ins.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <ButtonLink href="/events" size="lg">
            Discover events
          </ButtonLink>
          <ButtonLink href="/signup" size="lg" variant="outline">
            Become a host
          </ButtonLink>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        {features.map(({ icon: Icon, title, body }) => (
          <Card key={title}>
            <CardBody>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted">{body}</p>
            </CardBody>
          </Card>
        ))}
      </section>
    </div>
  );
}
