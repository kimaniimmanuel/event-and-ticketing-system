import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Settings, Building2, CalendarX } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Card, CardBody } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { EventCard } from "@/components/events/event-card";
import { getUserOrgRole, CAN_MANAGE_ORG } from "@/lib/orgs";

async function getOrg(slug: string) {
  return prisma.organization.findUnique({ where: { slug } });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const org = await getOrg(slug);
  if (!org) return { title: "Organization not found" };
  return {
    title: org.name,
    description: org.description ?? `Events by ${org.name}`,
  };
}

export default async function OrgPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const org = await getOrg(slug);
  if (!org) notFound();

  const now = new Date();
  const [upcoming, past, session] = await Promise.all([
    prisma.event.findMany({
      where: {
        organizationId: org.id,
        status: "PUBLISHED",
        visibility: "PUBLIC",
        startAt: { gte: now },
      },
      include: { category: { select: { name: true } } },
      orderBy: { startAt: "asc" },
    }),
    prisma.event.findMany({
      where: {
        organizationId: org.id,
        status: "PUBLISHED",
        visibility: "PUBLIC",
        startAt: { lt: now },
      },
      include: { category: { select: { name: true } } },
      orderBy: { startAt: "desc" },
      take: 12,
    }),
    auth(),
  ]);

  const role = await getUserOrgRole(session?.user?.id, org.id);
  const canManage = Boolean(role && CAN_MANAGE_ORG.includes(role));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="h-32 bg-primary/10">
          {org.banner && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={org.banner} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="flex items-start justify-between gap-4 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10">
              {org.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={org.logo} alt="" className="h-full w-full object-cover" />
              ) : (
                <Building2 className="h-8 w-8 text-primary" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{org.name}</h1>
              {org.description && (
                <p className="mt-1 max-w-xl text-sm text-muted">{org.description}</p>
              )}
            </div>
          </div>
          {canManage && (
            <ButtonLink href={`/orgs/${slug}/manage`} variant="outline" size="sm">
              <Settings className="h-4 w-4" />
              Manage
            </ButtonLink>
          )}
        </div>
      </div>

      {/* Upcoming */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Upcoming events</h2>
        {upcoming.length === 0 ? (
          <Card>
            <CardBody className="flex flex-col items-center gap-2 py-10 text-center text-muted">
              <CalendarX className="h-7 w-7" />
              <p>No upcoming events yet.</p>
            </CardBody>
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      {/* Past */}
      {past.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Past events</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
