import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Card, CardBody } from "@/components/ui/card";
import { OrgForm } from "@/components/orgs/org-form";
import { getUserOrgRole, CAN_MANAGE_ORG, CAN_MANAGE_ORG_ADMINS } from "@/lib/orgs";
import { updateOrgAction } from "./actions";
import { AdminManager } from "./admin-manager";
import { EventLinker } from "./event-linker";

export const metadata = { title: "Manage organization" };

export default async function ManageOrgPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const org = await prisma.organization.findUnique({
    where: { slug },
    include: {
      members: { include: { user: { select: { name: true, username: true } } } },
    },
  });
  if (!org) notFound();

  const role = await getUserOrgRole(session.user.id, org.id);
  if (!role || !CAN_MANAGE_ORG.includes(role)) {
    redirect(`/orgs/${slug}`);
  }

  // Events hosted by this user, marked with whether they're attached to this org.
  const hostedEvents = await prisma.event.findMany({
    where: { hostId: session.user.id },
    select: { id: true, title: true, organizationId: true },
    orderBy: { startAt: "desc" },
  });
  const linkable = hostedEvents.map((e) => ({
    id: e.id,
    title: e.title,
    attached: e.organizationId === org.id,
  }));

  const roleOrder = ["OWNER", "ADMIN"];
  const members = org.members
    .map((m) => ({
      userId: m.userId,
      name: m.user.name,
      username: m.user.username,
      role: m.role,
    }))
    .sort((a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={`/orgs/${slug}`}
        className="inline-flex items-center gap-1 text-sm text-muted hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        View public page
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Manage organization</h1>
        <p className="text-sm text-muted">You are the {role.toLowerCase()} of {org.name}.</p>
      </div>

      <Card>
        <CardBody>
          <OrgForm
            action={updateOrgAction.bind(null, org.id, slug)}
            submitLabel="Save changes"
            defaultValues={{
              name: org.name,
              description: org.description ?? "",
              logo: org.logo ?? "",
              banner: org.banner ?? "",
            }}
          />
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-4">
          <div>
            <h2 className="font-semibold">Admins</h2>
            <p className="text-sm text-muted">Owners and admins can manage this page.</p>
          </div>
          <AdminManager
            orgId={org.id}
            slug={slug}
            members={members}
            canManage={CAN_MANAGE_ORG_ADMINS.includes(role)}
          />
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-4">
          <div>
            <h2 className="font-semibold">Events</h2>
            <p className="text-sm text-muted">
              Add events you host to showcase them on this organization&apos;s page.
            </p>
          </div>
          <EventLinker orgId={org.id} slug={slug} events={linkable} />
        </CardBody>
      </Card>
    </div>
  );
}
