import Link from "next/link";
import { Building2, Users, CalendarDays } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Card, CardBody } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { FollowButton } from "@/components/orgs/follow-button";

export const metadata = { title: "Organizations" };

export default async function OrgsBrowsePage() {
  const session = await auth();

  const orgs = await prisma.organization.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { followers: true, events: true } } },
  });

  const followedIds = session?.user?.id
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
        <h1 className="text-2xl font-bold">Organizations</h1>
        <p className="text-sm text-muted">
          Follow institutions and communities to get notified about their new events.
        </p>
      </div>

      {orgs.length === 0 ? (
        <Card>
          <CardBody className="py-12 text-center text-muted">
            No organizations yet. Be the first to create one.
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {orgs.map((org) => (
            <Card key={org.id} className="flex h-full flex-col">
              <CardBody className="flex flex-1 flex-col gap-3">
                <Link href={`/orgs/${org.slug}`} className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10">
                    {org.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={org.logo} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Building2 className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <span className="font-semibold hover:text-primary">{org.name}</span>
                </Link>
                {org.description && (
                  <p className="line-clamp-2 text-sm text-muted">{org.description}</p>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {org._count.followers} followers
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-4 w-4" />
                    {org._count.events} events
                  </span>
                </div>
                <div className="mt-auto pt-2">
                  {session?.user ? (
                    <FollowButton
                      organizationId={org.id}
                      slug={org.slug}
                      initialFollowing={followedIds.has(org.id)}
                      size="sm"
                    />
                  ) : (
                    <ButtonLink href={`/login?callbackUrl=/orgs`} size="sm">
                      Follow
                    </ButtonLink>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
