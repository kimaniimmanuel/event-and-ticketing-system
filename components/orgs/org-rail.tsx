import Link from "next/link";
import { Building2, Users } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { FollowButton } from "@/components/orgs/follow-button";

export type RailOrg = {
  id: string;
  slug: string;
  name: string;
  logo: string | null;
  followerCount: number;
};

export function OrgRail({
  orgs,
  followedIds,
  isLoggedIn,
}: {
  orgs: RailOrg[];
  followedIds: Set<string>;
  isLoggedIn: boolean;
}) {
  if (orgs.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Organizations to follow</h2>
          <p className="text-sm text-muted">
            Follow institutions and communities to hear about their events first.
          </p>
        </div>
        <Link href="/orgs" className="shrink-0 text-sm font-medium text-primary hover:underline">
          See all →
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {orgs.map((org) => (
          <Card key={org.id} className="w-60 shrink-0">
            <CardBody className="space-y-3">
              <Link href={`/orgs/${org.slug}`} className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10">
                  {org.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={org.logo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Building2 className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold hover:text-primary">{org.name}</p>
                  <p className="inline-flex items-center gap-1 text-xs text-muted">
                    <Users className="h-3 w-3" />
                    {org.followerCount} followers
                  </p>
                </div>
              </Link>
              {isLoggedIn ? (
                <FollowButton
                  organizationId={org.id}
                  slug={org.slug}
                  initialFollowing={followedIds.has(org.id)}
                  size="sm"
                />
              ) : (
                <ButtonLink href="/login?callbackUrl=/events" size="sm">
                  Follow
                </ButtonLink>
              )}
            </CardBody>
          </Card>
        ))}
      </div>
    </section>
  );
}
