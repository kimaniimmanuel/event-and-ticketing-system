import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Settings, Building2, CalendarX, Users, CalendarCheck } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Card, CardBody } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { EventCard } from "@/components/events/event-card";
import { FollowButton } from "@/components/orgs/follow-button";
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

  const [followerCount, eventsHosted, myFollow] = await Promise.all([
    prisma.organizationFollow.count({ where: { organizationId: org.id } }),
    prisma.event.count({
      where: { organizationId: org.id, status: "PUBLISHED", visibility: "PUBLIC" },
    }),
    session?.user?.id
      ? prisma.organizationFollow.findUnique({
          where: {
            userId_organizationId: { userId: session.user.id, organizationId: org.id },
          },
        })
      : Promise.resolve(null),
  ]);
  const isFollowing = Boolean(myFollow);
  const memberSince = new Intl.DateTimeFormat("en-KE", {
    month: "short",
    year: "numeric",
    timeZone: "Africa/Nairobi",
  }).format(org.createdAt);

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
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                <span className="inline-flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {followerCount} {followerCount === 1 ? "follower" : "followers"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <CalendarCheck className="h-4 w-4" />
                  {eventsHosted} {eventsHosted === 1 ? "event hosted" : "events hosted"}
                </span>
                <span>On DUNDA since {memberSince}</span>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {session?.user ? (
              <FollowButton
                organizationId={org.id}
                slug={slug}
                initialFollowing={isFollowing}
                size="sm"
              />
            ) : (
              <ButtonLink href={`/login?callbackUrl=/orgs/${slug}`} size="sm">
                Follow
              </ButtonLink>
            )}
            {canManage && (
              <ButtonLink href={`/orgs/${slug}/manage`} variant="outline" size="sm">
                <Settings className="h-4 w-4" />
                Manage
              </ButtonLink>
            )}
          </div>
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

      {/* Past — a track record of the organization's activity */}
      {past.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Past events</h2>
            <p className="text-sm text-muted">
              A track record of events this organization has hosted.
            </p>
          </div>
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
