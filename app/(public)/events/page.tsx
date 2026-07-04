import { prisma } from "@/lib/db";
import { Card, CardBody, Badge } from "@/components/ui/card";

export const metadata = { title: "Discover events" };

export default async function DiscoverPage() {
  const events = await prisma.event.findMany({
    where: { status: "PUBLISHED", visibility: "PUBLIC" },
    include: { category: true },
    orderBy: { startAt: "asc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Discover events</h1>
        <p className="text-sm text-muted">
          Search and filters arrive in Sprint 3. Showing all upcoming public events.
        </p>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardBody className="text-center text-muted">
            No events yet. Run the seed script or create the first one.
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Card key={event.id}>
              <CardBody>
                <Badge>{event.category.name}</Badge>
                <h3 className="mt-2 font-semibold">{event.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{event.description}</p>
                <p className="mt-3 text-sm font-medium">
                  {event.startAt.toLocaleDateString("en-KE", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </p>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
