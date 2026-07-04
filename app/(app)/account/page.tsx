import Link from "next/link";
import { Building2, Plus } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Card, CardBody, Badge } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { ProfileForm } from "./profile-form";

export const metadata = { title: "My account" };

export default async function AccountPage() {
  const session = await auth();
  const [user, memberships] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session!.user.id },
      include: { interests: { include: { category: true } } },
    }),
    prisma.organizationMember.findMany({
      where: { userId: session!.user.id },
      include: { organization: { select: { name: true, slug: true } } },
    }),
  ]);
  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Avatar name={user.name} src={user.avatar} className="h-16 w-16 text-lg" />
        <div>
          <h1 className="text-2xl font-bold">{user.name}</h1>
          <p className="text-sm text-muted">
            @{user.username}
            {user.location ? ` · ${user.location}` : ""}
          </p>
        </div>
      </div>

      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Your interests</h2>
            <Link
              href="/onboarding"
              className="text-sm font-medium text-primary hover:underline"
            >
              Edit interests
            </Link>
          </div>
          {user.interests.length === 0 ? (
            <p className="text-sm text-muted">
              No interests set yet.{" "}
              <Link href="/onboarding" className="text-primary hover:underline">
                Pick some
              </Link>{" "}
              to personalize your discovery feed.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {user.interests.map((i) => (
                <Badge key={i.categoryId} className="bg-primary/10 text-primary">
                  {i.category.name}
                </Badge>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Your organizations</h2>
            <ButtonLink href="/orgs/new" variant="outline" size="sm">
              <Plus className="h-4 w-4" />
              New
            </ButtonLink>
          </div>
          {memberships.length === 0 ? (
            <p className="text-sm text-muted">
              You don&apos;t belong to any organizations yet. Create one to showcase your
              events under a single page.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {memberships.map((m) => (
                <li key={m.organizationId} className="flex items-center justify-between py-2">
                  <Link
                    href={`/orgs/${m.organization.slug}`}
                    className="inline-flex items-center gap-2 font-medium hover:text-primary"
                  >
                    <Building2 className="h-4 w-4 text-muted" />
                    {m.organization.name}
                  </Link>
                  <Badge className={m.role === "OWNER" ? "bg-primary/10 text-primary" : ""}>
                    {m.role.toLowerCase()}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-4">
          <h2 className="font-semibold">Edit profile</h2>
          <ProfileForm
            profile={{
              name: user.name,
              username: user.username,
              location: user.location,
              avatar: user.avatar,
            }}
          />
        </CardBody>
      </Card>
    </div>
  );
}
