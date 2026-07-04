import { Prisma } from "@prisma/client";
import { CalendarX } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Card, CardBody } from "@/components/ui/card";
import { EventCard } from "@/components/events/event-card";
import { OrgRail } from "@/components/orgs/org-rail";
import { EventFilters, type FilterValues } from "./event-filters";

export const metadata = { title: "Discover events" };

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const current: FilterValues = {
    q: sp.q?.trim() || undefined,
    category: sp.category || undefined,
    location: sp.location?.trim() || undefined,
    format: sp.format || undefined,
  };
  // The org rail only appears on the default (unfiltered) discovery view.
  const hasFilters = Boolean(
    current.q || current.category || current.location || current.format,
  );

  const where: Prisma.EventWhereInput = {
    status: "PUBLISHED",
    visibility: "PUBLIC",
    startAt: { gte: new Date() }, // upcoming only
  };
  if (current.q) {
    where.OR = [
      { title: { contains: current.q } },
      { description: { contains: current.q } },
    ];
  }
  if (current.category) where.categoryId = current.category;
  if (current.location) where.venue = { contains: current.location };
  if (current.format) where.format = current.format;

  const [events, categories, session, railOrgs] = await Promise.all([
    prisma.event.findMany({
      where,
      include: { category: { select: { name: true } } },
      orderBy: { startAt: "asc" },
      take: 60,
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    auth(),
    prisma.organization.findMany({
      orderBy: { followers: { _count: "desc" } },
      take: 8,
      include: { _count: { select: { followers: true } } },
    }),
  ]);

  const followedIds =
    !hasFilters && session?.user?.id
      ? new Set(
          (
            await prisma.organizationFollow.findMany({
              where: { userId: session.user.id },
              select: { organizationId: true },
            })
          ).map((f) => f.organizationId),
        )
      : new Set<string>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Discover events</h1>
        <p className="text-sm text-muted">
          Browse upcoming free events. Filter by category, location and format.
        </p>
      </div>

      {!hasFilters && (
        <OrgRail
          orgs={railOrgs.map((o) => ({
            id: o.id,
            slug: o.slug,
            name: o.name,
            logo: o.logo,
            followerCount: o._count.followers,
          }))}
          followedIds={followedIds}
          isLoggedIn={Boolean(session?.user)}
        />
      )}

      <EventFilters categories={categories} current={current} />

      <p className="text-sm text-muted">
        {events.length} {events.length === 1 ? "event" : "events"} found
      </p>

      {events.length === 0 ? (
        <Card>
          <CardBody className="flex flex-col items-center gap-2 py-12 text-center text-muted">
            <CalendarX className="h-8 w-8" />
            <p>No events found matching your search. Try adjusting your filters.</p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
